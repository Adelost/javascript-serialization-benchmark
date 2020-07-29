import avro from 'avro-js';
import avsc from 'avsc';
import BSON from 'bson';
import fs from 'fs';
import JsBin from 'js-binary';
import Pbf from 'pbf';
import protobufJs from 'protobufjs';
import protons from 'protons';
import { ROOT_DIR } from './_root';
import ProtoGoogleSchema from './data/google-protobuf_pb';
import ProtoPbfSchema from './data/pbf_pb';
import { benchmark, BenchmarkResult } from './utils/helper';
import bser from 'bser';

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

function createAvroSchemaBase(): any {
  return {
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
  }

}

const AvroJsSchema = avro.parse(createAvroSchemaBase());

export function testAvroJs(testData: any): Promise<BenchmarkResult> {
  const Schema = AvroJsSchema;
  return benchmark({
    data: testData,
    encode: data => Schema.toBuffer(data),
    decode: data => Schema.fromBuffer(data),
    sampleDecoded: data => data.items[0],
  });
}

const AVSC_DOUBLE = Infinity;
const AVSC_INT = 0;

const AvroAvscSchema = avsc.Type.forValue({
  items: [
    { x: AVSC_INT, y: AVSC_DOUBLE, z: AVSC_DOUBLE }
  ]
});

const AvroAvscOptionalSchema = avsc.Type.forValue({
  items: [
    { x: AVSC_INT, y: AVSC_DOUBLE, z: AVSC_DOUBLE },
    { x: null, y: null, z: null }
  ]
});

const AvroAvscUnmappedSchema = avsc.Type.forValue([[AVSC_DOUBLE]]);

export function testAvroAvsc(testData: any): Promise<BenchmarkResult> {
  const Schema = AvroAvscSchema;
  return benchmark({
    data: testData,
    encode: data => Schema.toBuffer(data),
    decode: data => Schema.fromBuffer(data),
    sampleDecoded: data => data.items[0],
  });
}

export function testAvroAvscOptional(testData: any): Promise<BenchmarkResult> {
  const Schema = AvroAvscOptionalSchema;
  return benchmark({
    data: testData,
    encode: data => Schema.toBuffer(data),
    decode: data => Schema.fromBuffer(data),
    sampleDecoded: data => data.items[0],
  });
}

export function testAvroAvscUnmapped(testData: any): Promise<BenchmarkResult> {
  const Schema = AvroAvscUnmappedSchema;
  return benchmark({
    data: testData,
    encode: data => Schema.toBuffer(data),
    decode: data => Schema.fromBuffer(data),
    sampleDecoded: data => data[0],
  });
}

const JsBinSchema = new JsBin.Type({
  items: [
    { x: 'int', y: 'float', z: 'float' }, // Note all float types in schema is 64-bit
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

export async function testProtoPbf(testData: any): Promise<BenchmarkResult> {
  const Schema = ProtoPbfSchema.Items;
  return benchmark({
    data: testData,
    encode: data => {
      const pbf = new Pbf();
      Schema.write(data, pbf);
      return pbf.finish();
    },
    decode: data => {
      const pbf = new Pbf(data);
      return Schema.read(pbf);
    },
    sampleDecoded: data => data.items[0],
  });
}

export function testProtoGoogle(testData: any): Promise<BenchmarkResult> {
  const Schema = ProtoGoogleSchema;
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

export function testBser(testData: any): Promise<BenchmarkResult> {
  return benchmark({
    data: testData,
    encode: data => bser.dumpToBuffer(data),
    decode: data => bser.loadFromBuffer(data),
    sampleDecoded: data => data.items[0],
  });
}
