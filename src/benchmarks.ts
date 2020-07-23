import avro from 'avro-js';
import BSON from 'bson';
import fs from 'fs';
import JsBin from 'js-binary';
import protobufJs from 'protobufjs';
import protons from 'protons';
import { ROOT_DIR } from './_root';
import ProtobufGoogleSchema from './data/test_pb';
import { benchmark, BenchmarkResult } from './utils/helper';

export function testJson(testData: any): Promise<BenchmarkResult> {
  return benchmark({
    data: testData,
    encode: data => JSON.stringify(data),
    decode: data => JSON.parse(data),
    sampleDecoded: data => data.items[0],
    encoding: 'utf8',
  });
}

export function testJsonUnmapped(testData: any): Promise<BenchmarkResult> {
  return benchmark({
    data: testData,
    encode: data => JSON.stringify(data),
    decode: data => JSON.parse(data),
    sampleDecoded: data => data[0],
    encoding: 'utf8',
  });
}

const AvroSchema = avro.parse({
  name: 'items',
  type: 'record',
  fields: [
    {
      name: 'items',
      type: {
        type: 'array',
        items: {
          name: 'item',
          type: 'record',
          fields: [
            { name: 'x', type: 'int' },
            { name: 'y', type: 'double' },
            { name: 'z', type: 'double' },
          ],
        },
      },
    },
  ],
});

export function testAvro(testData: any): Promise<BenchmarkResult> {
  const Schema = AvroSchema;
  return benchmark({
    data: testData,
    encode: data => Schema.toBuffer(data),
    decode: data => Schema.fromBuffer(data),
    sampleDecoded: data => data.items[0],
  });
}

const JsBinSchema = new JsBin.Type({
  items: [
    { x: 'int', y: 'float', z: 'float' },
  ],
});

export function testJsBin(testData: any): Promise<BenchmarkResult> {
  const Schema = JsBinSchema;
  return benchmark({
    data: testData,
    encode: data => Schema.encode(data),
    decode: data => Schema.decode(data),
    sampleDecoded: data => data.items[0],
  });
}

const JsBinOptionalSchema = new JsBin.Type({
  items: [
    { 'x?': 'int', 'y?': 'float', 'z?': 'float' },
  ],
});

export function testJsBinOptional(testData: any): Promise<BenchmarkResult> {
  const Schema = JsBinOptionalSchema;
  return benchmark({
    data: testData,
    encode: data => Schema.encode(data),
    decode: data => Schema.decode(data),
    sampleDecoded: data => data.items[0],
  });
}

const JsBinUnmappedSchema = new JsBin.Type([['float']]);

export function testJsBinUnmapped(testData: any): Promise<BenchmarkResult> {
  const Schema = JsBinUnmappedSchema;
  return benchmark({
    data: testData,
    encode: data => Schema.encode(data),
    decode: data => Schema.decode(data),
    sampleDecoded: data => data[0],
  });
}

const JsBinJsonUnmappedSchema = new JsBin.Type('json');

export function testJsBinJsonUnmapped(testData: any): Promise<BenchmarkResult> {
  const Schema = JsBinJsonUnmappedSchema;
  return benchmark({
    data: testData,
    encode: data => Schema.encode(data),
    decode: data => Schema.decode(data),
    sampleDecoded: data => data[0],
  });
}

let ProtobufJsSchema: any = null;

export async function testProtoJs(testData: any): Promise<BenchmarkResult> {
  if (!ProtobufJsSchema) ProtobufJsSchema = await protobufJs.load(`${ROOT_DIR}/data/test.proto`);
  const Schema = ProtobufJsSchema.Items;
  return benchmark({
    data: testData,
    encode: data => Schema.encode(data).finish(),
    decode: data => Schema.decode(data),
    sampleDecoded: data => data.items[0],
  });
}

export function testProtoGoogle(testData: any): Promise<BenchmarkResult> {
  const Schema = ProtobufGoogleSchema;
  const ItemsWrap = Schema.Items;
  const ItemWrap = Schema.Item;
  return benchmark({
    data: testData,
    encode: data => {
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
    },
    decode: data => ItemsWrap.deserializeBinary(data),
    // sampleDecoded: data => data.itemsList[0],
    sampleDecoded: data => data.getItemsList()[0].toObject(),
  });
}

const ProtobufProtonsSchema = protons(fs.readFileSync(`${ROOT_DIR}/data/test.proto`));

export function testProtoProtons(testData: any): Promise<BenchmarkResult> {
  const Schema = ProtobufProtonsSchema.Items;
  return benchmark({
    data: testData,
    encode: data => Schema.encode(data),
    decode: data => Schema.decode(data),
    sampleDecoded: data => JSON.parse(JSON.stringify(data.items[0])),
  });
}

const ProtoMixedEncodeSchema = protons(fs.readFileSync(`${ROOT_DIR}/data/test.proto`));
let ProtoMixedDecodeSchema: any = null;


export async function testProtoMixed(testData: any): Promise<BenchmarkResult> {
  const EncodeSchema = ProtoMixedEncodeSchema.Items;
  if (!ProtoMixedDecodeSchema) ProtoMixedDecodeSchema = await protobufJs.load(`${ROOT_DIR}/data/test.proto`);
  const DecodeSchema = ProtoMixedDecodeSchema.Items;
  return benchmark({
    data: testData,
    encode: data => EncodeSchema.encode(data),
    decode: data => DecodeSchema.decode(data),
    sampleDecoded: data => data.items[0],
  });
}

export function testBson(testData: any): Promise<BenchmarkResult> {
  return benchmark({
    data: testData,
    encode: data => BSON.serialize(data),
    decode: data => BSON.deserialize(data),
    sampleDecoded: data => data.items[0],
  });
}

export function testBsonUnmapped(testData: any): Promise<BenchmarkResult> {
  return benchmark({
    data: testData,
    encode: data => BSON.serialize(data),
    decode: data => BSON.deserialize(data),
    sampleDecoded: data => data[0],
  });
}
