# Binary serialization comparison in JavaScript (Protocol Buffer, Avro, BSON, etc.)
 
This is a comparison and benchmark of various binary serialization formats and libraries used in JavaScript as of 2020-07-28.
 
I was myself trying to decide what binary serialization format I should use in my personal projects, and what started out simple soon turned into a rather extensive comparison.
 
By sharing my findings, I hope it can be of help (and save time) to someone in a similar situation and perhaps inspire some developers to try out binary serialization.

## TL;DR (or Abstract)

This article and benchmark attempts to answer what binary serialization library to use with regard to performance, compression size and ease of use.

The following formats and libraries are compared:

* Protocol Buffer: `protobuf-js`, `pbf`, `protons`, `google-protobuf`
* Avro: `avsc`
* BSON: `bson`
* BSER: `bser`
* JSBinary: `js-binary`

Based on the current benchmark results in this article, the author would rank the top libraries in the following order (higher values are better, measurements are given as x times faster than JSON):

1. `avsc`: 10x encoding, 3-10x decoding
2. `js-binary`: 2x encoding, 2-8x decoding
3. `protobuf-js`: 0.5-1x encoding, 2-6x decoding,
4. `pbf`: 1.2x encoding, 1.0x decoding
5. `bser`: 0.5x encoding, 0.5x decoding
6. `bson`: 0.5x encoding, 0.7x decoding

Ranked by encoded size (compared to JSON) only:

1. `avsc`, `js-binary`: 32%:
2. `protobuf-js`, `pbf`, `protons`, `google-protobuf`: 42%
3. `bser`: 67%
4. `bson`: 79%
5. `JSON`: 100%

Due to various reasons outlined in the article, the author would not currenly recommend the following libraries:

* `protons`: 2x encoding, 0.05x decoding
* `google-protobuf`: 0.3-0.5x encoding, 0.8x decoding


Feel free to skip to the [Conclusion](#conclusion) sections of the article to read the summarized motivation. For performance graphs and detailed measurements skip to [Result (final)](#result-final). To reproduce the measurements, skip to [Setup](#setup).


## Table of content

- [Introduction](#introduction)
- [Setup](#setup)
- [Disclaimer](#disclaimer)
- [Libraries](#libraries)
- [Benchmark](#benchmark)
- [Result (Protocol Buffers)](#result-protocol-buffers)
- [Result (final)](#result-final)
- [Result (extra)](#result-extra)
- [Conclusion](#conclusion)

## Introduction
 
Data serialization is ubiquitous in most areas such as sending and receiving data over the network or storing/reading data from the file system. While JSON is a common modus operandi (especially in JavaScript), using a binary serialization format typically provides an advantage in compression size and performance at the cost of losing human readability of the encoded data.
 
Two common binary serialization formats across many programming languages are Protocol Buffers and Apache Avro. Avro is inherently a bit more compact than Protobuf, whereas Protobuf uses the additional data as field tags that could make it slightly more forgiving when changing the schema. For those interested, an excellent in-depth explanation has [already been written](https://martin.kleppmann.com/2012/12/05/schema-evolution-in-avro-protocol-buffers-thrift.html) by Martin Kleppmann.

 
In addition to this, several more recent JavaScript-oriented libraries will be included in the comparison.
 
This article will mostly focus on the performance aspect and provide a brief overview of each implementation, but as always, there will be pros and cons of each implementation that could be overlooked depending on your use-case.
 
## Setup
 
To reproduce the benchmark results, follow these steps.
 
* Install Node.js ( `14 LTS` is requirement). 
* Install dependencies:
 
```shell script
npm install
``` 
* Use the default configuration or modify `src/config.ts`.
* Select what libraries to test by changing `run-tests.sh` or use default that tests all libraries.
* Run `run-tests.sh` (if you are on Windows use Git BASH or similar):  
 
```shell script
cd src
. run-tests.sh
```
 
* Create graph images (requires Python with matplotlib installed) by running:
 
```shell script
python plot.py
``` 
 
Graph settings can further be configured inside the script. Graph images are by default written to `img/`
 
Measurements are accumulated into `src/tmp/plot.json` each benchmark iteration. If needed, simply delete the file to reset the graph.
 
## Disclaimer
 
This article only focuses on measurements using JavaScript. Many of the measured formats support additional programming languages that could have different performance characteristics than indicated in this benchmark.
 
Although outside the scope of this article, compression size (and thereby network transfer speed) can be further improved at the cost of encoding/decoding performance by combining the output with a compressor/decompressor library such `google/snappy` or `zlib`.
 
This is the first time I use many of the listed libraries and as such there might still be additional optimizations that I am unaware of. Still, I believe my implementation is a good indication to what most users will end up using.
 
Feel free to inspect my implementations in `src/benchmarks.ts`, and let me know if you find any glaring mistakes (or better yet by submitting a pull request).
 
 
## Libraries
 
The following libraries and versions are tested (sorted by NPM weekly downloads):

* `bser "6.10.1"` - 7,671k
* `protobufjs "6.10.1"` - 3,449k
* `bson "4.0.4"` - 1,826k
* `pbf "3.2.1"` - 431k
* `google-protobuf "4.0.0-rc.1"` - 348k
* `avsc "5.4.21"` - 43k
* `protons "1.2.1"` - 30k 
* ~~`avro-js "1.10.0"` - 1.2k~~
* `js-binary "1.2.0"` - 0.3k
 
They are categorized as:

* Protocol Buffer: `protobuf-js`, `pbf`, `protons`, `google-protobuf`
* Avro: `avsc`, `avro-js`
* BSON: `bson`
* BSER: `bser`
* JSBinary: `js-binary`


`bser` is a binary serialization library developed for Facebook's "Watchman" filewatcher and is the most downloaded binary serialization library. It is however, mainly used for loca-IPC (inter process communication) as strings are represented as binary with no specific encoding.

`google-protobuf` is Google's official Protocol Buffer release, but `protobufjs` is by far the more popular library.

`avsc` seems to be the most popular Avro library. `avro-js` is an offical release by the Apache Foundation but this was excluded from the result section as it seems to be based on an older version of `avsc`, contains less features and both libraries yielded very similar benchmark results with a slight advantage to `avsc`.

`bson` is the official JavaScript BSON library released by MongoDB.

`js-binary` is the most obscure library (judging by weekly downloads) and uses a custom binary format that could make interoperability with other programming languages difficult, but this could also make it a good choice due to it being designed with JavaScript in mind.
 
## Benchmark
 
Each format will be compared against JavaScript's native JSON library as a baseline, regarding compression size and encoding/decoding time. 
 
The data used in the benchmark is a growing array of tuples that is grown in increments of 1/8 of its previous size at each iteration, and (to speed things up) 1/4 when reaching sizes above 10 MB. In a real scenario it could be thought of as a list of vectors in a 2D or 3D space, such as a 3D-model or similarly data intensive object. 
 
To further complicate things the first element of the tuple is an integer. This will give a slight edge to some serialization-formats as an integer can be represented more compact in binary rather than floating-point number. 
 
To all formats that support multiple datatype sizes; integers are encoded as a 32-bit signed integer and decimal numbers are encoded as 64-bit floating-point numbers.
 
The data is as follows:
 
```typescript
[
  [1, 4.0040000000000004, 1.0009999999999994], 
  [2, 4.371033333333333, 0.36703333333333266], 
  [3, 5.171833333333334, 0.4337666666666671], 
  [4, 6.473133333333333, 0.36703333333333354], 
  ...
]
``` 
 
The first challenge that arose is that not all measured serialization formats supports root level arrays, and almost no one seems to support tuples, and as such the arrays first need to be mapped to structs as follows:
 
```typescript
{
  items: [
    {x: 1, y: 4.0040000000000004, z: 1.0009999999999994},
    {x: 2, y: 4.371033333333333, z: 0.36703333333333266},
    {x: 3, y: 5.171833333333334, z: 0.4337666666666671},
    {x: 4, y: 6.473133333333333, z: 0.36703333333333354},
    ...
  ]
}
``` 
 
This wrapped struct array is the final "payload" that is used in the benchmark unless specified otherwise. This further gives an advantage to some formats over JSON as duplicate information such as field names can be encoded more efficiently in a schema.

It should be noted that the time to convert the unmapped data to the mapped structs is excluded from all measurements in the benchmark.
 
### Precautions

Each appended element in the growing array is modified slightly so that all elements are unique.
 
It was discovered that some libraries can considerably impact the performance of other libraries when measured in the same running process, possible due to memory reuse. To prevent this (and to get reproducible results) all measurements in the results section has been measured with each implementation running in an isolated Node.js process.
 
To reduce unpredictable stalls by the automatic garbage collector in Node.js, the garbage collector is forcefully triggered before each measurement. This did not have any discernable impact on the measured performance other than reducing some randomness.
 
### Unmapped data
 
Compared to the mapped (object with array of structs) data, the unmapped (array of arrays) data is more compact and contains less redundant information. As such additional performance could potentially be gained if the target application uses a similar representation internally.

This is investigated in an additional result section that is found after the main result section.
 
### Hardware
 
The benchmark is done in Node.js v12.16.3 on 64-bit Windows 10, with an Intel(R) Core(TM) i7-7700HQ CPU @ 2.80GHz and 32 GB RAM(Speed: 2667 MT/s).
 
## Result (Protocol Buffers)
 
Protocol Buffer was tested more rigorously than the other formats and is thus given this dedicated section.
 
An additional format `Protobuf (mixed)` is added to the comparison that uses `protons` during encoding and `protobuf-js` during decoding (this is explained further down). 
 
All protobuf-implementations in the test uses the following proto-file as schema.
 
```protobuf
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
 
It should be noted that all fields in version "proto3" are optional by default, which could be an advantage feature-wise and disadvantage performance-wise as many of the other measured formats are mandatory by default.
 
### Performance graph
 
![Benchmark of protocol buffers](img/bench-protobuf.svg)
 
> This graph shows the encode/decode time of each implementation in seconds as well as ratio (compared to JSON) given the payload size in MB (measured as JSON). Note that a logaritmic scale is used on the `Encode/Decode time (s)` and `JSON size (MB)` axis.
 
During encoding `protons` and `Protobuf (mixed)` perfomed the fastest at 2 times faster than native JSON at most payload sizes. `protobufjs` and `google-protobuf` perfomed the slowest at about 2-3 times slower.
 
During decoding, `protobufjs`, `Protobuf (mixed)` performed the fastest at about 5 times faster than native JSON at most payload sizes (although native JSON catches up again at payloads above 200 MB). `protons` performed by far the slowest; 20-30 times slower, compared to native JSON.
 
### Compression ratio

All implementations (`protobuf-js`, `pbf`, `protons`, `google-protobuf`) stayed consistent to the Protocol Buffer format and resulted in an identical compression ratio of 42% (compared to the corresponding file size of JSON) at all measured payload sizes.

### Maximum payload size

This is a ranking of the estimated maximum safe payload limit (measured as JSON) each library was able to process:

1. `pbf`, `mixed`: 372 MB
2. `JSON`, `V8`, `MsgPack`: 298 MB
3. `protobuf-js`: 153 MB
4. `google-protobuf`: 98 MB
5. `protons`: 40 MB

 When exceeding the payload limit (given the default JavaScript heap size), a heap allocation error occurred in most cases.

### Negative effects during decoding
 
| |JSON, V8, MsgPack|JS|Google|Protons|Pbf|mixed
|---|---|---|---|---|---|---
|Prototype pollution      | |x| |x| |x
|Getters/Setters| | | |x| | | 
|Requires unwrapping| | |x| | 
|Unexpected field renames| | |x| | 
 
> This table shows an overview of negative effects during decoding.
 
`pbf` convert cleanly to JavaScript without any detected remnats from the encoding process.
 
`protobuf-js` (which also affects `Protobuf (mixed)`) contains serialization remnants (such as type name) hidden in the prototype of the decoded objects, but should behave as a normal plain JavaScript object for most purposes.

`protons` should be usable as a data object but wraps all fields into getters/setters that could decrease performance. 
 
`google-protobuf` is wrapped in a builder pattern and need to be converted before it can be used and can introduce unexpected field renames. It is however free from metadata after the final conversion.
 
It is as of now unknown if any of the polluted formats incur an additional overhead to plain objects as this is outside the current scope of this article, but it is something to keep in mind.
 
### Remarks
 
#### Protobuf (JS)
 
`protobuf-js` is slow at encoding but fast at decoding.
 
During encoding it provided mixed result. At sizes below 1 MB it mostly performs better than the native JSON implementation, but at any larger sizes it performs 2 to 3 times worse.
 
It was the only implementation that reached its max payload limit of 153 MB during encoding, all other formats reached their limit at decoding. It was however discovered that it can decode payloads (created by other implementations) of greater sizes, up to 372 MB.
 
#### Protobuf (Pbf)
 
`pbf` is average at encoding and decoding, but is deserialized cleanly without added remnants.
 
By default `pbf` requires an extra build step where boilerplate code is generated from `.proto` file, though it seems to offer a few alternatives to streamline the process.
 
It is also the only Protobuf format that is converted cleanly to JavaScript, which could be a distinct advantage in some cases.
 
#### Protobuf (Google)
 
`google-protobuf` is slow at encoding, performs average during decoding but might require additional decoding that would further decrease performance, requires extra setup and can cause unexpected renaming of variables.
 
It does not seem to have an option for deserializing directly form JSON. Instead the following `Items` and `Item` classes are generated by the protocol buffer compiler that generates a Java-esque builder pattern that the date needs to be mapped into, as outlined here:
 
```typescript
...
const ItemsWrap = Schema.Items;
const ItemWrap = Schema.Item;
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
 
This also unexpectedly renames our array from "items" into "itemsList" which can catch some people of guard and affect the receiving code, as this is not something that is present in other tested Protocol Buffers.
 
It performs the worst of the implementations during decoding at 2.5 to 3 times slower than native JSON, possible due to the builder overhead.
 
Deserialization is also misleading. Though it seems to performs only slightly worse than native JSON, the data is still wrapped in the builder object which should be unsuitable for most purposes, and an additional call to ".toObject()" is required to fully convert it back to JSON, which would further decrease the performance and still includes the unexpected name change.
 
#### Protobuf (Protons)
 
`protons` is fast at encoding but very slow at decoding.
 
The decoded object has all fields wrapped into getters, which might be partially responsible for the poor decoding performance, and while serviceable, could cause some issues depending on how the decoded data is used. The easiest way to remove all getters/setters is to perform a JSON serialization/deserialization which will further increase decoding time.
 
It was only able to decode payloads of 47 MB in size, but opposite to `protobuf-js` it can encode payloads of much greater size.
 
#### Protobuf (mixed)
 
`Protobuf (mixed)` is fast at both encoding and decoding and is good at handling large file sizes.
 
This implementation is simply a mix of `protobuf-js` and `protons`, where `protons` is used for encoding and `protobuf-js` for decoding. This result in the best overall performance of all protobuf implementations and can handle larger payloads than both formats can individually. While this might be too impromptu for most users, it gives us an estimate of how well either of these implementations could perform with some improvements.
 
### Further remarks
 
Due to poor results and to reduce redundancy, `protons` and `google-js` will be excluded in further comparisons.
 
## Result (final)
 
This is the final comparison of the various formats.
 
### Performance graph
 
![Benchmark of binary serialization](img/bench-full.svg)
 
> This graph shows the encode/decode time of each implementation in seconds as well as ratio (compared to JSON) given the payload size in MB (measured as JSON). Note that a logaritmic scale is used on the `Encode/Decode time (s)` and `JSON size (MB)` axis.
 
During encoding `avro-js` performed the fastest of all implementations (with good margin) at 10 times faster than native JSON at most payload sizes, followed by `js-binary` and `Protobuf (Mixed)` at 2 times faster. Although native JSON once again catches up at payloads above 200 MB (using the default Node.js heap size).
 
During decoding, `avro-js`, `protobufjs`, `js-binary`, `Protobuf (Mixed)` all performed equally well at about 5 times faster than native JSON at most payload sizes. `bson` performed the slowest at 1.5 times slower.

### Compression ratio

This is a ranking of the encoded size (compared to JSON) of each library:

1. `avsc`, `js-binary`: 32%:
2. `protobuf-js`, `pbf`: 42%
3. `bser`: 67%
4. `bson`: 79%
5. `JSON`: 100%

### Maximum payload size

This is a ranking of the estimated maximum safe payload limit (measured as JSON) each library was able to process:

1. `avsc`, `jsbin`, `pbf`, `bser`, `Protobuf (mixed)`: 372 MB
2. `JSON`: 298 MB
3. `protobuf-js`: 153 MB
4. `bson`: 21 MB

### Negative effects during decoding
 
| |BSON|JSBIN|AVRO|BSER
|---|---|---|---|---
|Prototype pollution | | |x| 
 
> This table shows an overview of negative effects during decoding.
 
`bson`, `js-binary` and `bser`, all convert cleanly to JavaScript without any detected remnats from the encoding process.
 
`avro-js`, contains serialization remnants (such as type name) hidden in the prototype of the decoded objects, but should behave as a normal plain JavaScript object for most purposes.
 
### Remarks
 
#### AVRO (Avsc)
 
`avsc` has a more flexible schema definition than most other libraries. Normally an Avro schema is defined in JSON as in this example: 
 
```typescript
// Type for "float[][]"
const type = avsc.Type.forSchema({
  "type": "array",
  "items": {
    "type": "array",
    "items": "float",
  }
});
type.schema(); // { "type": "array", ... }
```
 
But in `avsc` the same schema can be deferred from the data as:
 
```typescript
// Type for "float[][]"
const inferredType = avsc.Type.forValue([[0.5]]);
inferredType.schema(); // { "type": "array", ... }
```
 
Or as a more complex object:
```typescript
const AVSC_INT = 0;
const AVSC_FLOAT = 0.5;
const AVSC_DOUBLE = Infinity;
 
// Type for "{items: { x?: number, y?: number, z?: number}[]}"
const complexType = avsc.Type.forValue({
  items: [
    { x: AVSC_INT, y: AVSC_DOUBLE, z: AVSC_DOUBLE },
    { x: null, y: null, z: null },
  ]
});
```
 
 
#### JSBIN
 
Like `avsc` it also has a more succinct schema definition than most other implementations.
 
``` typescript
// Type for double[][]
// Note that all float types in js-binary is 64-bit
const type = new JsBin.Type([['float']]);
 
// Type for {x?: int, y?: double, z?: double}[]
const complexType = new JsBin.Type({
  items: [
    { 'x?': 'int', 'y?': 'float', 'z?': 'float' },
  ],
});
```
 
## Result (extra)
 
As mentioned in the Benchmark chapter the original data needed to be simplified to a more verbose format that was supported by all serialization formats. As the unmapped data is more compact and contains less redundant information, additional performance could potentially be gained if the target application uses a similar representation internally. This will be investigated for `avsc`, `js-binary`, `bson` in this section. 
 
As neither formats support tuples, the tuple will be encoded as a 64-bit float array which is expected to increase encoded size ratio slightly as the first field of the tuple can no longer be encoded as a 32-bit integer.
 
`avsc`, `js-binary` also has additional settings such as "optional fields", and `js-binary` has the datatype JSON that will be investigated with regards to performance.
 
### Performance graphs
 
#### JSON
 
![Benchmark of binary serialization](img/bench-json-extra.svg)
 
> Performance graph of `JSON` with different settings.
 
| |JSON|JSON (unmapped)
|---|---|---
|Size ratio|1.00|0.77
 
Switching to unmapped data improved both encoding (1/4 faster) and decoding (1/3 faster). It also reduced size ratio to 0.77 of the original JSON.
 
#### AVRO Avsc
 
![Benchmark of binary serialization](img/bench-avro-extra.svg)
 
> Performance graph of `avsc` with different settings.
 
| |AVRO Ascv|AVRO Ascv (optional)|AVRO Ascv (unmapped)|
|---|---|---|---
|Size ratio|0.32|0.38|0.49
|Payload limit|372 MB|372 MB|237 MB
 
Making all fields `optional` did decrease performance somewhat from about 10 faster to 4 times faster (though still faster than most other formats). It also increases size ratio slightly.
 
Switching to `unmapped` data also worsened performance similarly. One plausible explanation could be that the tuples are encoded as a dynamically sized array, which would make sense as the schema does not contain any information about the size of the tuple. However, performance is still good compared to other formats. Size ratio was also increased by 63% which is higher than expected as switching from 2 64-bit + 1 32-bit value to 3 64-bit values would only indicate a 20% increase.
 
 
#### JSBIN
 
![Benchmark of binary serialization](img/bench-jsbin-extra.svg)
 
> Performance graph of `js-binary` with different settings.
 
| |JSBIN|JSBIN (optional)|JSBIN (unmapped)|JSBIN JSON (unmapped)
|---|---|---|---|---
|Size ratio|0.32|0.38|0.48|0.77
 
Switching to `unmapped` had a slight improvement on encoding speed, but apart from this `optional` and `unmapped` had almost no impact on performance.
 
Increase in size ratio for both `optional` and `unmapped` is identical to `avsc`.
 
Encoding all data using the `js-binary` datatype `json` performed almost identically to `JSON (unmapped)` as well as size ratio. This seems to indicate that datatype `json` simply consists of using native JSON to create a string that is then stored as datatype `string` in `js-binary`.
 
#### BSON
 
![Benchmark of binary serialization](img/bench-bson-extra.svg)
 
> Performance graph of `bson` with different settings.
 
| |BSON|BSON (unmapped)
|---|---|---
|Size ratio|0.79|0.79|0.48|0.77
 
Unmapped BSON is still slower than JSON in most cases, but it did receive a performance improvement, especially during decoding.
 
For some unexplained reason the encoded size ratio remained the same for both the mapped and unmapped data. This seems to indicate that BSON can optimize duplicate data, although the encoded size ratio is still relatively large compared to other formats.
 
 
## Conclusion

The libraries `js-binary`, `pbf`, `bser` and `bson` all convert cleanly back to JavaScript without any detected remnants from the encoding process. `avro-js` and `js-binary` contained minor remnants. `google-protobuf` and `protons` had major remnants or ramifications.

Overall `avsc` performed very well in all measurements, was easy to setup and seems to be the overall best performing serialization library. Switching from mandatory to optional fields slightly worsened performance and compression ratio, but still puts it on top. Performance was also slightly worse when processing small arrays compared to similar sized structs.
 
`js-binary` performed well in all measurements, was easy to setup and is deserialized cleanly. One disadvantage being that it uses a custom binary format that could make interoperability with other programming languages difficult. Switching from mandatory to optional fields had almost no impact on performance.

Regarding Protocol Buffer libraries it should be noted that all fields are optional by default in the latest schema version.
 
`protobuf-js` was slow at encoding but fast at decoding, `protons` was fast at encoding but very slow at decoding. However, through a combination of using `protons` during encoding and `protobuf-js` during decoding, performance on pair with `js-binary` (with slightly worse encoding size) could be achieved. 
 
`pbf` performed only slightly better than native JSON but is deserialized cleanly without any remnants.
 
`bser` was slower than native JSON at both encoding and decoding (slightly slower than BSON). It was however very good at handling large payloads, and provides a good compression ratio considering it does not require a schema, and is deserialized cleanly.

`bson` was slower than native JSON at both encoding and decoding, provided only a modest compression ratio, and was bad at handling large payloads, but does not require a schema and is deserialized cleanly.
 
`google-protobuf` was slow at encoding, performs average during decoding but might require additional decoding that would further decrease performance, requires extra setup and can cause unexpected renaming of variables.

