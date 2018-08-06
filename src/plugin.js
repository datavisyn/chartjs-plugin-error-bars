'use strict';

import Chart from 'chart.js';

// TODO: options: bar width or scale to bin
// TODO: add animations to error bars
// TODO: docs
// TODO: refactoring

const defaultOptions = {
  width: '80%'
};

const ErrorBarsPlugin = {
  id: 'chartJsPluginErrorBars',

  _drawErrorBar(chart, ctx, model, plus, minus, options, horizontal) {
    const color = options.color ? options.color : model.color;
    ctx.save();
    ctx.strokeStyle = color;
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

  _getBarchartBaseCoords(chart) {
    const coords = [];
    chart.data.datasets.forEach((d, i) => {
      var bars = chart.getDatasetMeta(i).data;
      coords.push(bars.map((b, j) => {
        let barLabel = '';

        // line charts do not have labels in their meta data, access global label array instead
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

  _isHorizontal(chart) {
    return chart.config.type === 'horizontalBar';
  },

  afterDraw(chart, easing, options) {
    options = Object.assign({}, defaultOptions, options);

    // determine value scale and direction (vert/hor)
    var horizontal = this._isHorizontal(chart);
    var vScale = horizontal ? chart.scales['x-axis-0'] : chart.scales['y-axis-0'];

    var ctx = chart.ctx;
    ctx.save();

    var errorBarCoords = chart.data.datasets.map((d) => d.errorBars);
    var barchartCoords = this._getBarchartBaseCoords(chart);

    barchartCoords.forEach((dataset, i) => {
      dataset.forEach((b) => {
        let hasLabelProperty = errorBarCoords[i].hasOwnProperty(b.label);
        let errorBarData = null;
        if (hasLabelProperty) {
          errorBarData = errorBarCoords[i][b.label];
        }
        // hierarchical has its label property nested
        if (!hasLabelProperty && b.label && b.label.label && errorBarCoords[i].hasOwnProperty(b.label.label)) {
          errorBarData = errorBarCoords[i][b.label.label];
        }

        if (errorBarData) {
          var plus = vScale.getRightValue(errorBarData.plus);
          var minus = vScale.getRightValue(errorBarData.minus);
          this._drawErrorBar(chart, ctx, b, plus, minus, options, horizontal);
        }
      });
    });

    ctx.restore();
  }
};

Chart.pluginService.register(ErrorBarsPlugin);

export default ErrorBarsPlugin;
