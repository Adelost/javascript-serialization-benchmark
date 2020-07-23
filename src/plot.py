import matplotlib.pyplot as plt
import json as json

FILE = 'tmp/plot.json'

X_LABEL = 'JSON size (MB)'
X_MIN_VALUE = 0.5
X_MAX_VALUE = 2000

ALLOWED_LABELS = {
    # "JSON",
    # "BSON",
    # "AVRO",
    # "PROTOBUF (mixed)",
    # "PROTOBUF (JS)",
    # "JSBIN",

    # "JSON",
    # "JSON (unmapped)",
    # "JSBIN (unmapped)",
    #
    # "JSBIN",
    # "JSBIN (optional)",
    # "JSBIN JSON (unmapped)",

    # "JSON",
    # "JSON (unmapped)",
    # "BSON",
    # "BSON (unmapped)",

    # "JSON",
    # "PROTOBUF (mixed)",
    # "PROTOBUF (JS)",
    # "PROTOBUF (Protons)",
    # "PROTOBUF (Google)",
}
SKIPPED_LABELS = {
    # "JSON",
    # "BSON",
    # "AVRO",
    # "PROTOBUF (mixed)",
    # "PROTOBUF (JS)",
    # "JSBIN",

    # "JSON",
    # "JSON (unmapped)",
    # "JSBIN (unmapped)",
    #
    # "JSBIN",
    # "JSBIN (optional)",
    # "JSBIN JSON (unmapped)",

    # "JSON",
    # "JSON (unmapped)",
    # "BSON",
    # "BSON (unmapped)",

    # "JSON",
    # "PROTOBUF (mixed)",
    # "PROTOBUF (JS)",
    # "PROTOBUF (Protons)",
    # "PROTOBUF (Google)",
}


def main():
    # plt.figure(figsize=(8, 9))
    # plt.figure(figsize=(12, 14))
    plt.figure(figsize=(10, 8.5))
    ax = plot_x(None, 'encodedTime', 1, 'Encode time (s)', True)
    ax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.5), ncol=3, fancybox=True)
    plot_x('JSON', 'encodedTime', 2, 'Encode time (ratio)', False)
    plot_x(None, 'decodedTime', 3, 'Decode time (s)', True)
    plot_x('JSON', 'decodedTime', 4, 'Decode time (ratio)', False)
    # plot_x(None, 'encodedSize', 4, 'Encoded size', False)

# plt.savefig('../img/tmp.svg')
    plt.show()


with open(FILE) as json_file:
    TEST_DATA = json.load(json_file)


def plot_x(baselineKey, yKey, id, yLabel, log):
    baseline = None
    if baselineKey:
        baseline = TEST_DATA[baselineKey]
    plt.subplot(4, 1, id)
    for key in TEST_DATA:
        item = TEST_DATA[key]
        x_values = item['x']
        x_start, x_stop = find_x_range(x_values)
        y_values = item['y'][yKey]
        label = item['label']
        if ALLOWED_LABELS and label not in ALLOWED_LABELS:
            continue
        if label in SKIPPED_LABELS:
            continue
        x_values = x_values[x_start:x_stop]
        y_values = y_values[x_start:x_stop]
        print(f'{label}, {yKey}, start x:{x_values[0]}, y:{y_values[0]}')
        if baseline:
            baseline_y_values = baseline['y'][yKey][x_start:x_stop]
            y_values_ratios = calc_ratios(y_values, baseline_y_values)
            y_values = y_values_ratios
        # y_values = pad_y_values(x_values, y_values)
        plt.plot(x_values, y_values, label=label)

    ax = plt.gca()
    # ax.set(xlim=(1))
    ax.set_xscale('log')
    if log:
        ax.set_yscale('log')

    plt.xlabel(X_LABEL)
    plt.ylabel(yLabel or yKey)

    plt.grid()
    # plt.legend(loc='lower right')
    # plt.legend(loc='upper left')
    # ax.legend(bbox_to_anchor=(1.1, 0), loc='lower right')
    # ax.legend(bbox_to_anchor=(0.5, 1), loc='center')

    return ax
    # ax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.4),
    #           fancybox=True, shadow=True, ncol=5)


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
