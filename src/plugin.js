'use strict';

import Chart from 'chart.js';

// TODO: options: bar width or scale to bin
// TODO: add animations to error bars

const defaultOptions = {
  /**
   * number with or without pixel or percent with percentage sign
   */
  width: '80%',

  /**
   * stroke width in pixel
   */
  lineWidth: 1
};

const ErrorBarsPlugin = {
  id: 'chartJsPluginErrorBars',

  /**
   * draw error bar mark
   * @param chart chartjs instance
   * @param ctx canvas context
   * @param model bar base coords
   * @param plus positive error bar length
   * @param minus negative error bar length
   * @param options plugin options
   * @param horizontal orientation
   * @private
   */
  _drawErrorBar(chart, ctx, model, plus, minus, options, horizontal) {
    const color = options.color ? options.color : model.color;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = options.lineWidth;
    ctx.beginPath();
    if (horizontal) {
      ctx.moveTo(model.x + minus, model.y - 5);
      ctx.lineTo(model.x + minus, model.y + 5);
      ctx.moveTo(model.x + minus, model.y);
      ctx.lineTo(model.x + plus, model.y);
      ctx.moveTo(model.x + plus, model.y - 5);
      ctx.lineTo(model.x + plus, model.y + 5);
      ctx.stroke();
    } else {
      ctx.moveTo(model.x - 5, model.y - plus);
      ctx.lineTo(model.x + 5, model.y - plus);
      ctx.moveTo(model.x, model.y - plus);
      ctx.lineTo(model.x, model.y - minus);
      ctx.moveTo(model.x - 5, model.y - minus);
      ctx.lineTo(model.x + 5, model.y - minus);
      ctx.stroke();
    }
    ctx.restore();
  },

  /**
   * get original barchart base bar coords
   * @param chart chartjs instance
   * @returns {Array}
   * @private
   */
  _getBarchartBaseCoords(chart) {
    const coords = [];
    chart.data.datasets.forEach((d, i) => {
      const bars = chart.getDatasetMeta(i).data;
      coords.push(bars.map((b, j) => {

        // line charts do not have labels in their meta data, access global label array instead
        let barLabel = '';
        if (!b._model.label) {
          barLabel = chart.data.labels[j];
        } else {
          barLabel = b._model.label;  // required for hierarchical
        }
        return {
          label: barLabel,
          x: b._model.x,
          y: b._model.y,
          color: b._model.borderColor
        }
      }));
    });
    return coords;
  },

  /**
   * check whether the chart orientation is horizontal
   * @param chart chartjs instance
   * @returns {boolean}
   * @private
   */
  _isHorizontal(chart) {
    return chart.config.type === 'horizontalBar';
  },

  /**
   * compute error bars width in pixel or percent
   * @param chart chartjs instance
   * @param options plugin options
   * @private
   */
  _computeWidth(chart, options) {
    // TODO:
    console.log(chart);
    console.log(options);
  },

  /**
   * plugin hook to draw the error bars
   * @param chart chartjs instance
   * @param easing animation function
   * @param options plugin options
   */
  afterDraw(chart, easing, options) {
    options = Object.assign({}, defaultOptions, options);

    // determine value scale and orientation (vertical or horizontal)
    const horizontal = this._isHorizontal(chart);
    const vScale = horizontal ? chart.scales['x-axis-0'] : chart.scales['y-axis-0'];

    const ctx = chart.ctx;
    ctx.save();

    const errorBarCoords = chart.data.datasets.map((d) => d.errorBars);
    const barchartCoords = this._getBarchartBaseCoords(chart);

    // map error bar to barchart bar via label property
    barchartCoords.forEach((dataset, i) => {
      dataset.forEach((b) => {
        let hasLabelProperty = errorBarCoords[i].hasOwnProperty(b.label);
        let errorBarData = null;

        // common scale such as categorical
        if (hasLabelProperty) {
          errorBarData = errorBarCoords[i][b.label];
        }
        // hierarchical scale has its label property nested in b.label object as b.label.label
        if (!hasLabelProperty && b.label && b.label.label && errorBarCoords[i].hasOwnProperty(b.label.label)) {
          errorBarData = errorBarCoords[i][b.label.label];
        }

        // error bar data for the barchart bar or point in linechart
        if (errorBarData) {
          const plus = vScale.getRightValue(errorBarData.plus);
          const minus = vScale.getRightValue(errorBarData.minus);
          this._drawErrorBar(chart, ctx, b, plus, minus, options, horizontal);
        }
      });
    });

    ctx.restore();
  }
};

Chart.pluginService.register(ErrorBarsPlugin);

export default ErrorBarsPlugin;
