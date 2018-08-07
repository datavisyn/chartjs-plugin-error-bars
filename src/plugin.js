'use strict';

import Chart from 'chart.js';

const defaultOptions = {
  /**
   * with as number, or as string with pixel (px) ending, or as string with percentage (%) ending
   */
  width: 10
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
   * @param options plugin options
   * @returns {*} width in pixel as number
   * @private
   */
  _computeWidth(chart, horizontal, options) {
    const width = options.width;
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
        widthInPx = options.width;
      }
    }
    return widthInPx;
  },

  /**
   * draw error bar mark
   * @param chart chartjs instance
   * @param ctx canvas context
   * @param model bar base coords
   * @param plus positive error bar length
   * @param minus negative error bar length
   * @param color error bar stroke color
   * @param width error bar width in pixel
   * @param horizontal orientation
   * @private
   */
  _drawErrorBar(chart, ctx, model, plus, minus, color, width, horizontal) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.beginPath();
    if (horizontal) {
      ctx.moveTo(model.x + minus, model.y - width / 2);
      ctx.lineTo(model.x + minus, model.y + width / 2);
      ctx.moveTo(model.x + minus, model.y);
      ctx.lineTo(model.x + plus, model.y);
      ctx.moveTo(model.x + plus, model.y - width / 2);
      ctx.lineTo(model.x + plus, model.y + width / 2);
      ctx.stroke();
    } else {
      ctx.moveTo(model.x - width / 2, model.y - plus);
      ctx.lineTo(model.x + width / 2, model.y - plus);
      ctx.moveTo(model.x, model.y - plus);
      ctx.lineTo(model.x, model.y - minus);
      ctx.moveTo(model.x - width / 2, model.y - minus);
      ctx.lineTo(model.x + width / 2, model.y - minus);
      ctx.stroke();
    }
    ctx.restore();
  },

  /**
   * plugin hook to draw the error bars
   * @param chart chartjs instance
   * @param easingValue animation function
   * @param options plugin options
   */
  afterDraw(chart, easingValue, options) {
    options = Object.assign({}, defaultOptions, options);

    // wait for easing value to reach 1 at the first render, after that draw immediately
    chart.__renderedOnce = chart.__renderedOnce || easingValue === 1;

    // error bar and barchart bar coords
    const errorBarCoords = chart.data.datasets.map((d) => d.errorBars);
    const barchartCoords = this._getBarchartBaseCoords(chart);

    if (!barchartCoords || !barchartCoords[0] || !barchartCoords[0][0] || !errorBarCoords) {
      return;
    }

    // determine value scale and orientation (vertical or horizontal)
    const horizontal = this._isHorizontal(chart);
    const vScale = horizontal ? chart.scales['x-axis-0'] : chart.scales['y-axis-0'];

    const errorBarWidth = this._computeWidth(chart, horizontal, options);

    const ctx = chart.ctx;
    ctx.save();

    // map error bar to barchart bar via label property
    barchartCoords.forEach((dataset, i) => {
      dataset.forEach((bar) => {
        let cur = errorBarCoords[i];
        if (!cur) {
          return;
        }
        let hasLabelProperty = cur.hasOwnProperty(bar.label);
        let errorBarData = null;

        // common scale such as categorical
        if (hasLabelProperty) {
          errorBarData = cur[bar.label];
        } else if (!hasLabelProperty && bar.label && bar.label.label && cur.hasOwnProperty(bar.label.label)) {
          // hierarchical scale has its label property nested in b.label object as b.label.label
          errorBarData = cur[bar.label.label];
        }

        // error bar data for the barchart bar or point in linechart
        if (errorBarData) {
          const errorBarColor = options.color ? options.color : bar.color;
          const plus = vScale.getRightValue(errorBarData.plus);
          const minus = vScale.getRightValue(errorBarData.minus);
          if (chart.__renderedOnce) {
            this._drawErrorBar(chart, ctx, bar, Math.abs(plus), (Math.abs(minus) * -1), errorBarColor, errorBarWidth, horizontal);
          }
        }
      });
    });

    ctx.restore();
  }
};

Chart.pluginService.register(ErrorBarsPlugin);

export default ErrorBarsPlugin;
