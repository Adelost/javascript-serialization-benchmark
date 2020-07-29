import math

import matplotlib.pyplot as plt
import json as json

INPUT_FILE = 'tmp/plot.json'
OUTPUT_DIR = '../img'
OUTPUT_NAME = 'tmp.svg'

PRINT_SIZE_RATIO = False
SAVE_IMAGE = True
ONLY_RATIO = False

X_LABEL = 'JSON size (MB)'
X_MIN_VALUE = 0.5
X_MAX_VALUE = 2000
ALLOWED_LABELS = []


def main():
    global OUTPUT_NAME
    global ALLOWED_LABELS
    global ONLY_RATIO
    global PRINT_SIZE_RATIO
    global X_MIN_VALUE

    # # Hack to print size ratios at 10 MB (ignore displayed image)
    X_MIN_VALUE = 10
    PRINT_SIZE_RATIO = True
    plot()
    PRINT_SIZE_RATIO = False
    X_MIN_VALUE = 0.5

    # Main test
    OUTPUT_NAME='bench-full.svg'
    ALLOWED_LABELS = [
        "JSON",
        "JSBIN",
        "AVRO Avsc",
        "BSER",
        "BSON",
        "PROTOBUF JS",
        "PROTOBUF Pbf",
        "PROTOBUF mixed",

    ]
    plot()
    #
    # Protocol buffers
    OUTPUT_NAME='bench-protobuf.svg'
    ALLOWED_LABELS = [
        "JSON",
        "PROTOBUF JS",
        "PROTOBUF Pbf",
        "PROTOBUF Protons",
        "PROTOBUF Google",
        "PROTOBUF mixed",
    ]
    plot()

    # Result extra
    OUTPUT_NAME='bench-unmapped.svg'
    ONLY_RATIO = True

    # JSON extra
    OUTPUT_NAME='bench-json-extra.svg'
    ALLOWED_LABELS = [
        "JSON",
        "JSON (unmapped)",
    ]
    plot()

    # Avro extra
    OUTPUT_NAME='bench-avro-extra.svg'
    ALLOWED_LABELS = [
        "JSON",
        "JSON (unmapped)",
        "AVRO Avsc",
        "AVRO Avsc (optional)",
        "AVRO Avsc (unmapped)",
    ]
    plot()

    # BSON extra
    OUTPUT_NAME='bench-bson-extra.svg'
    ALLOWED_LABELS = [
        "JSON",
        "JSON (unmapped)",
        "BSON",
        "BSON (unmapped)",
    ]
    plot()

    # JSBIN extra
    OUTPUT_NAME='bench-jsbin-extra.svg'
    ALLOWED_LABELS = [
        "JSON",
        "JSON (unmapped)",
        "JSBIN",
        "JSBIN (optional)",
        "JSBIN (unmapped)",
        "JSBIN JSON (unmapped)",
    ]
    plot()

def plot():
    columns = 3
    if ALLOWED_LABELS:
        columns = math.ceil(len(ALLOWED_LABELS) / 2)
    if PRINT_SIZE_RATIO:
        global X_MIN_VALUE
        X_MIN_VALUE = 10
        ax = plot_x('JSON', 'encodedSize', 1, 'Encoded size', True)
        ax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.38), ncol=columns, fancybox=True)
    else:
        if ONLY_RATIO:
            plt.figure(figsize=(10, 4.15))
            ax = plot_x('JSON', 'encodedTime', 1, 'Encode time (ratio)', False)
            ax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.38), ncol=columns, fancybox=True)
            plot_x('JSON', 'decodedTime', 2, 'Decode time (ratio)', False)
        else:
            plt.figure(figsize=(10, 8.5))
            ax = plot_x(None, 'encodedTime', 1, 'Encode time (s)', True)
            ax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.5), ncol=columns, fancybox=True)
            plot_x('JSON', 'encodedTime', 2, 'Encode time (ratio)', False)
            plot_x(None, 'decodedTime', 3, 'Decode time (s)', True)
            plot_x('JSON', 'decodedTime', 4, 'Decode time (ratio)', False)

    if SAVE_IMAGE:
        plt.savefig(f'{OUTPUT_DIR}/{OUTPUT_NAME}')
    else:
        plt.show()


with open(INPUT_FILE) as json_file:
    TEST_DATA = json.load(json_file)


def plot_x(baselineKey, yKey, id, yLabel, log):
    baseline = None
    if baselineKey:
        baseline = TEST_DATA[baselineKey]
    if ONLY_RATIO:
        plt.subplot(2, 1, id)
    else:
        plt.subplot(4, 1, id)
    if ALLOWED_LABELS:
        keys = ALLOWED_LABELS
    else:
        keys = TEST_DATA

    for key in keys:
        item = TEST_DATA[key]
        x_values = item['x']
        x_start, x_stop = find_x_range(x_values)
        y_values = item['y'][yKey]
        label = item['label']
        x_values = x_values[x_start:x_stop]
        y_values = y_values[x_start:x_stop]
        if baseline:
            baseline_y_values = baseline['y'][yKey][x_start:x_stop]
            y_values_ratios = calc_ratios(y_values, baseline_y_values)
            y_values = y_values_ratios
        # y_values = pad_y_values(x_values, y_values)
        print(f'{label}, {yKey}, start x:{round(x_values[0], 2)}, y:{round(y_values[0], 2)}')
        plt.plot(x_values, y_values, label=label)

    ax = plt.gca()
    ax.set_xscale('log')
    if log:
        ax.set_yscale('log')
    plt.xlabel(X_LABEL)
    plt.ylabel(yLabel or yKey)
    plt.grid()
    return ax


def pad_y_values(x_values, y_values):
    diff = len(x_values) - len(y_values)
    if diff > 0:
        y_values += [None] * diff
    return y_values


def calc_ratios(y_values, baseline_y_values):
    y_values_ratios = []
    for i, v in enumerate(y_values):
        if i < len(baseline_y_values) and baseline_y_values[i] is not 0:
            ratio = v / baseline_y_values[i]
        else:
            ratio = 0
        y_values_ratios.append(ratio)
    return y_values_ratios


def find_x_range(xs):
    x_start = 0
    x_stop = -1
    for index, value in enumerate(xs):
        if value >= X_MIN_VALUE:
            x_start = index
            break
    for index, value in enumerate(xs):
        if value > X_MAX_VALUE:
            x_stop = index - 1
            break
    return x_start, x_stop


if __name__ == '__main__':
    main()

# JSON, encodedSize, start x:10.47, y:1.0
# BSON, encodedSize, start x:10.47, y:0.79
# AVRO, encodedSize, start x:10.47, y:0.32
# PROTOBUF JS, encodedSize, start x:10.47, y:0.42
# PROTOBUF Google, encodedSize, start x:10.47, y:0.42
# PROTOBUF Protons, encodedSize, start x:10.47, y:0.42
# PROTOBUF mixed, encodedSize, start x:10.47, y:0.42
# JSBIN, encodedSize, start x:10.47, y:0.32
# JSBIN (optional), encodedSize, start x:10.47, y:0.38
# JSON (unmapped), encodedSize, start x:10.47, y:0.77
# JSBIN (unmapped), encodedSize, start x:10.47, y:0.48
# JSBIN JSON (unmapped), encodedSize, start x:10.47, y:0.77
# BSON (unmapped), encodedSize, start x:10.47, y:0.79
