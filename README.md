# JavaScript binary serialization comparison 

I was trying to decide what binary serialization format I should use with regard to performance, compression size and ease of use, and before I knew it I had spent the last few days doing an in-depth benchmark comparison. 

It should be a common use case of a lot of people, so I thought it would be useful to share since I have not found a similar comparison.

## Introduction

Data serialization is ubiquitous in most areas, be it sending and data over the network, or saving data into a file. While JSON is the most common modus operandi (especially in JavaScript), using a binary serialization format should provide advantages in compression size and possible also in performance.

Google's Protocol Buffers and Apache Avro (at least outside of JavaScript world) seems to be the most common binary formats. Out of these Avro is a bit more compact than Protobuf, whereas Protobuf uses the additional data as field tags that could make it slightly more forgiving when changing the schema. As always your mileage may vary depending on your use case. For those interested an excellent in depth explanation has already been written by Martin Kleppmann: https://martin.kleppmann.com/2012/12/05/schema-evolution-in-avro-protocol-buffers-thrift.html

## Setup

To run the benchmark yourself, follow these steps.

* Install Node.js ( `12.18.3 LTS` is recommended). 
* Install dependencies:

```shell script
npm install

``` 

* Use default configuration or modify `src/config.ts` as you see fit.
* Test all libraries by default or modify what library to test by changing `run-tests.sh` .
* Run `run-tests.sh` (if you are on Windows use Git BASH or similar) as:  

```shell script
cd src
. run-tests.sh
```

* View graph (requires Python with matplotlib installed) by running:

```shell script
python plot.py

``` 
 
What measurements to plot can further be configured inside the script.

Measurements are accumulated into `src/tmp/plot.json` each benchmark iteration. If needed, simply delete the file to reset the graph.

## Disclaimer

This is the first time I use many of the listed libraries and as such there might still be additional optimizations that I am unaware of. Still, I believe my implementation is true to what the majority of users will end up with.

Feel free to inspect my implementations in `src/benchmarks.ts` and let me know if you find any glaring mistakes.

## Libraries

The following libraries and versions are tested (sorted by weekly downloads):

```

"protobufjs": "6.10.1",             // 3,449k
"bson": "4.0.4",                    // 1,826k
"google-protobuf": "4.0.0-rc.1",    // 348k
"protons": "1.2.1"                  // 30k
"avro-js": "1.10.0",                // 1.2k
"js-binary": "1.2.0",               // 0.3k

``` 

They are categorized as:

* Protocol Buffer ( `protobufjs` , `google-protobuf` , `protons` ): `google-protobuf` is Googles official release, but `protobufjs` is by far the most popular, possible due to it being easier to use. To further compare against `protobufjs` a third library called `protons` is included.  
* BSON ( `bson` ): BSON stands for Binary JSON and is popularized by its use in MongoDB. 
* Avro ( `avro-js` ): Although relatively unused `avro-js` is the official JavaScript release by Apache Foundation.
* JS-Binary ( `js-binary` ): The most obscure (judging by weekly downloads), still `js-binary` seemed like a good contender due to it being easy to use (having a very compact and flexible schema-format) and being optimized for JavaScript. The main drawback being that it will be difficult to use in other programming languages should the need arise.

 

## Benchmark

Each format will be compared against JavaScripts built in JSON library as a baseline, with regard to compression size and encoding/decoding time. 

The data used in the benchmark is an array of tuples that is multiplied in increments of 1/8 below 10 MB and 1/4 above (to speed things up) for each sample. In a real scenario it could be though of as a list of vectors in a 2D or 3D space, such as a 3D-model or similarly data intensive object. 

To further complicate things the first element in the tuple is an integer. This will give a slight edge to some serialization-formats as an integer can be represented more compact in binary rather than floating-point number.

The data is as follows:

```

[
  [1, 4.0040000000000004, 1.0009999999999994],
  [2, 4.371033333333333, 0.36703333333333266],
  [3, 5.171833333333334, 0.4337666666666671],
  [4, 6.473133333333333, 0.36703333333333354],
  ...
]

``` 

Each appended element is modified slightly so that all elements are unique in order to avoid unpredictable object reuse.

The first challenge that arose is that not all serialization formats supports root level arrays, and almost no one seems to support tuples, and as such the arrays first need to be mapped to structs as follows:

```

{
  "items": [
    {"x": 1, "y": 4.0040000000000004, "z": 1.0009999999999994},
    {"x": 2, "y": 4.371033333333333, "z": 0.36703333333333266},
    {"x": 3, "y": 5.171833333333334, "z": 0.4337666666666671},
    {"x": 4, "y": 6.473133333333333, "z": 0.36703333333333354},
    ...
  ]
}

``` 

This wrapped struct array is the final payload that is used in the benchmark unless specified otherwise.

This should also be the most common use case for most people since most data need to contain some form of names, especially if the data is also used by languages other than JavaScript, such as C++ or Java.
 
This further gives an advantage to some formats over JSON as duplicate information such as  field names can be encoded more efficiently in a schema.  

To those interested there exists an extra result section with results marked as `(unmapped)` that uses the original unmapped array of arrays data to compare against.

### Hardware

The benchmark is done in Node.js v12.16.3 on 64-bit Windows 10, with an Intel i7-4790K 4.00GHz CPU and 16 GB RAM.

## Result (Protocol Buffers)

Because of its high popularity, Protocol Buffer was tested more rigorously than the other formats, and is thus given this dedicated section.

An additional format `Protobuf (mixed)` is added to the comparison that uses `protons` during encoding and `protobuf-js` during decoding, which is explained further down. 
 
All protobuf-implementations in the test uses the following proto-file as schema.

```

syntax = "proto3";

message Item {
  int32 x  = 1;
  double y  = 2;
  double z  = 3;
}

message Items {
  repeated Item items = 1;
}

``` 

#### Protobuf result table

| | JSON |JS|Google|Protons|mixed|
|---|---|---|---|---|---
|Payload limit|298 MB|153 MB|98 MB| 40 MB| 372 MB
|Size ratio|1.00|0.41|0.41|0.41|0.41|

This table shows the maximum safe payload limit (measured as JSON) each implementation was able to handle as well as the compression ratio.

When exceeding the payload limit, given the default JavaScript heap size, a heap allocation error occurred in most cases.

All implementation stayed consistent to the protobuf format and resulted in an identical compression ratio of 0.41 compared to the corresponding file size of JSON at all measured payload sizes.

#### Protobuf result chart

![Benchmark of protocol buffers](img/bench-protobuf.svg)

This chart shows the encode/decode time of each implementation in seconds as well as ratio (compared to JSON) given the payload size in MB (measured as JSON). Please note that a logaritmic scale is used on the `Decode time (s)` and `JSON size (MB)` axis.

During encoding `Protobuf (Protons)` and `Protobuf (mixed)` generally performed the best. Slightly better than native JSON. Expecially at payloads larger than 200 MB.

During decoding `Protobuf (Protons)` and `Protobuf (mixed)` generally performed the best. 

#### Protobuf (JS)

During encoding `protobuf-js` provided mixed result. Although measurements with a low payload size is somewhat unreliable, at sizes between 0.2-1 MB it seems to perform better than the native JSON implementation, but at any larger sizes it performs 2 to 3 times worse than what is expected.
  
It is however among the fastest during decoding (although native JSON catches up again at payloads above 200 MB) and as good as JSON at decoding large file sizes.
 

#### Protobuf (Protons)

During decoding `protons` performed by far the worst at 20-30 times worse than JSON. It was also only able to decode payloads of 47 MB in size. 

The decoded object also has all fields wrapped into getters, which might be partially responsible for the poor performance, and while serviceable, could cause some issues depending on how the decoded data is used. The easiest way to remove all getters/setters is to perform a JSON serialization/deserialization which will further increase decoding time.

Strangely however, it is among the fastest at encoding, performing 1-2 times better than JSON, especially during file sizes above 100 MB, and is able to decode file sizes equal to native JSON.

#### Protobuf (Google)

Google's `google-protobuf` requires the most boilerplate code to work. There does not seem to be an option for deserializing directly form JSON. Instead the following `Items` and `Item` classes are generated by the protocol buffer compiler that the data then needs to be set into in a Java-esque builder pattern style as outlined here:

```

...
const ItemsWrap = Messages.Items;
const ItemWrap = Messages.Item;
const itemsWrap = new ItemsWrap();
const itemWraps = data.items.map(item => {
  const itemWrap = new ItemWrap();
  itemWrap.setX(item.x);
  itemWrap.setY(item.y);
  itemWrap.setZ(item.z);
  return itemWrap;
});
itemsWrap.setItemsList(itemWraps);
return itemsWrap.serializeBinary();
```

This also unexpecedly renames our array from "items" into "itemsList" which can catch some people of guard and cause trouble in the receiving code.

It also performs the worse during decoding at 2.5 to 3 times worse than native JSON, possible due to the builder overhead.

Deserialization is also misleading. Though it seems to peforms only slightly worse than native JSON, the data is still wrapped in the builder object which should be unusable for most pruposes, and an additional call to ".toObject()" is required to fully convert it back to JSON which almost doubles the performance overhead, and still includes the unexpected name change.

#### Protobuf (mixed)

This implementation is simply a mix of `protobuf-js` and `protons` where `protons` is used for encoding and `protobuf-js` for decoding, to give the best overall performance of all implemenation and to handle larger payloads than both formats are able to individually (able to both encode and decode file sizes equal to native JSON). While this might too primitive for some people it gives us an estimate of how well either of these implementations could perform with some additional optimizations.

The result of encoding `protons` and decoding `protobuf-js` is already outlined in previous sections.

#### Data pollution during decoding

| | JSON |JS|Google|Protons|mixed|
|---|---|---|---|---|---
|Prototype pollution      | |x|x|x|x
|Getters/Setters| | | |x| 
|Requires wrapping| | |x| | 
|Unexpected field renames| | |x| | 

All of the measured implementations add additional metadata to the prototype of the decoded data.

As mentioned in the previous section, `google-protobuf` is wrapped in a builder pattern. It is mostly unusable in its decoded form and needs to be converted further before it can be used. `protons` is still usable but wraps all fields into getters/setters. `protobuf-js` (which also affects `Protobuf (mixed)` ) should be mostly usable as JSON, but contains some additional serialization information hidden in the prototype. 

It is as of now unkown if any of the raw decoded formats incur an additional overhead to plain objects as this is outside the current scope of this article, but it is something to keep in mind.

#### Further remarks

Due to poor results, `protons` and `google-js` will be excluded in further comparisons.

## Result (final comparison)

#### Protobuf result chart

![Benchmark of binary serialization](img/bench-full.svg)

This chart shows the encode/decode time of each implementation in seconds as well as ratio (compared to JSON) given the payload size in MB (measured as JSON). Please note that a logaritmic scale is used on the `Decode time (s)` and `JSON size (MB)` axis.
