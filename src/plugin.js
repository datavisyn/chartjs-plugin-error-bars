'use strict';

import Chart from 'chart.js';

const defaultOptions = {
  /**
   * stroke color
   * @default: derived from borderColor
   */
  color: undefined,

  /**
   * width as number, or as string with pixel (px) ending, or as string with percentage (%) ending
   */
  width: 10,

  /**
   * lineWidth as number, or as string with pixel (px) ending, or array of such definition
   */
  lineWidth: 2,

  /**
   * whether the error values are given in absolute values or relative (default)
   */
  absoluteValues: false
};

const ErrorBarsPlugin = {
  id: 'chartJsPluginErrorBars',

  /**
   * get original barchart base bar coords
   * @param chart chartjs instance
   * @returns {Array} containing label, x, y and color
   * @private
   */
  _getBarchartBaseCoords(chart) {
    const coords = [];
    chart.data.datasets.forEach((d, i) => {
      const bars = chart.getDatasetMeta(i).data;
      const values = d.data;
      coords.push(bars.map((b, j) => {

        // line charts do not have labels in their meta data, access global label array instead
        let barLabel = '';
        if (!b._model.label) {
          barLabel = chart.data.labels[j];
        } else {
          barLabel = b._model.label; // required for hierarchical
        }
        return {
          label: barLabel,
          value: values[j],
          x: b._model.x,
          y: b._model.y,
          color: b._model.borderColor
        };
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
   * @param horizontal orientation
   * @param width plugin option width
   * @returns {*} width in pixel as number
   * @private
   */
  _computeWidth(chart, horizontal, width) {
    let widthInPx = width;

    try {

      if (typeof width === 'string') {
        if (width.match(/px/)) {
          widthInPx = parseInt(width.replace(/px/, ''), 10);
        } else {

          // handle percentage values: convert to positive number between 0 and 100
          const widthInPercent = Math.min(100, Math.abs(Number(width.replace(/%/, ''))));
          const model = chart.getDatasetMeta(0).data[0]._model;

          if (chart.config.type === 'line') {
            widthInPx = parseInt(model.controlPointPreviousX + model.controlPointNextX, 10);
          } else if (horizontal) {
            widthInPx = parseInt(model.height, 10);
          } else if (!horizontal) {
            widthInPx = parseInt(model.width, 10);
          }

          widthInPx = (widthInPercent / 100) * widthInPx;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (Number.isNaN(widthInPx)) {
        widthInPx = width;
      }
    }
    return widthInPx;
  },

  /**
   * draw error bar mark
   * @param ctx canvas context
   * @param model bar base coords
   * @param plus positive error bar position
   * @param minus negative error bar position
   * @param color error bar stroke color
   * @param width error bar width in pixel
   * @param lineWidth error ber line width
   * @param horizontal orientation
   * @private
   */
  _drawErrorBar(ctx, model, plus, minus, color, lineWidth, width, horizontal) {
    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    if (horizontal) {
      ctx.moveTo(minus, model.y - width / 2);
      ctx.lineTo(minus, model.y + width / 2);
      ctx.moveTo(minus, model.y);
      ctx.lineTo(plus, model.y);
      ctx.moveTo(plus, model.y - width / 2);
      ctx.lineTo(plus, model.y + width / 2);
    } else {
      ctx.moveTo(model.x - width / 2, plus);
      ctx.lineTo(model.x + width / 2, plus);
      ctx.moveTo(model.x, plus);
      ctx.lineTo(model.x, minus);
      ctx.moveTo(model.x - width / 2, minus);
      ctx.lineTo(model.x + width / 2, minus);
    }
    ctx.stroke();
    ctx.restore();
  },

  /**
   * resolve scale for current dataset from config and fallback to default scale
   * @param chart chartjs instance
   * @param horizontal orientation
   * @param i dataset index
   */
  _resolveScale(chart, horizontal, i) {
    const xAxisId = chart.data.datasets[i].xAxisID || 'x-axis-0';
    const yAxisId = chart.data.datasets[i].yAxisID || 'y-axis-0';
    const scaleId = horizontal ? xAxisId : yAxisId;
    return chart.scales[scaleId];
  },

  /**
   * plugin hook to draw the error bars
   * @param chart chartjs instance
   * @param easingValue animation function
   * @param options plugin options
   */
  afterDatasetsDraw(chart, easingValue, options) {
    // wait for easing value to reach 1 at the first render, after that draw immediately
    chart.__renderedOnce = chart.__renderedOnce || easingValue === 1;

    if (!chart.__renderedOnce) {
      return;
    }

    options = Object.assign({}, defaultOptions, options);

    // error bar and barchart bar coords
    const errorBarCoords = chart.data.datasets.map((d) => d.errorBars);
    const barchartCoords = this._getBarchartBaseCoords(chart);

    if (!barchartCoords || !barchartCoords[0] || !barchartCoords[0][0] || !errorBarCoords) {
      return;
    }

    // determine value scale and orientation (vertical or horizontal)
    const horizontal = this._isHorizontal(chart);

    const errorBarWidths = (Array.isArray(options.width) ? options.width : [options.width]).map((w) => this._computeWidth(chart, horizontal, w));
    const errorBarLineWidths = Array.isArray(options.lineWidth) ? options.lineWidth : [options.lineWidth];
    const errorBarColors = Array.isArray(options.color) ? options.color : [options.color];


    const ctx = chart.ctx;
    ctx.save();

    // map error bar to barchart bar via label property
    barchartCoords.forEach((dataset, i) => {
      const vScale = this._resolveScale(chart, horizontal, i);
      dataset.forEach((bar) => {
        let cur = errorBarCoords[i];
        if (!cur) {
          return;
        }
        const hasLabelProperty = Object.hasOwnProperty.call(cur, bar.label);
        let errorBarData = null;

        // common scale such as categorical
        if (hasLabelProperty) {
          errorBarData = cur[bar.label];
        } else if (!hasLabelProperty && bar.label && bar.label.label && Object.hasOwnProperty.call(cur, bar.label.label)) {
          // hierarchical scale has its label property nested in b.label object as b.label.label
          errorBarData = cur[bar.label.label];
        }

        if (!errorBarData) {
          return;
        }

        const errorBars = Array.isArray(errorBarData) ? errorBarData : [errorBarData];
        const value = vScale.getRightValue(bar.value);

        errorBars.forEach((errorBar, ei) => {
          // error bar data for the barchart bar or point in linechart
          const errorBarColor = errorBarColors[ei % errorBarColors.length] ? errorBarColors[ei % errorBarColors.length] : bar.color;
          const errorBarLineWidth = errorBarLineWidths[ei % errorBarLineWidths.length];
          const errorBarWidth = errorBarWidths[ei % errorBarWidths.length];

          const plusValue = options.absoluteValues ? errorBar.plus : (value + Math.abs(errorBar.plus));
          const minusValue = options.absoluteValues ? errorBar.minus : (value - Math.abs(errorBar.minus));

          const plus = vScale.getPixelForValue(plusValue);
          const minus = vScale.getPixelForValue(minusValue);

          this._drawErrorBar(ctx, bar, plus, minus, errorBarColor, errorBarLineWidth, errorBarWidth, horizontal);
        });
      });
    });

    ctx.restore();
  }
};

Chart.pluginService.register(ErrorBarsPlugin);

export default ErrorBarsPlugin;
