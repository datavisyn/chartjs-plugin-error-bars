'use strict';

import Chart from 'chart.js';

// TODO: options: bar color, bar width
// TODO: add animations to error bars

const ErrorBarsPlugin = {
  id: 'chartJsPluginErrorBars',

  _drawErrorBar(ctx, model, plus, minus, horizontal) {
    ctx.save();
    ctx.strokeStyle = model.color;
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

  _isHorizontal(chart) {
    return chart.config.type === 'horizontalBar';
  },

  afterDatasetsDraw(chart, easing) {
    // determine value scale and direction (vert/hor)
    var horizontal = this._isHorizontal(chart);
    var vScale = horizontal ? chart.scales['x-axis-0'] : chart.scales['y-axis-0'];

    var ctx = chart.ctx;
    ctx.save();

    var errorBars = chart.data.datasets.map((d) => d.errorBars);
    var barCoords = [];
    chart.data.datasets.forEach((d, i) => {
      var bars = chart.getDatasetMeta(i).data;
      barCoords.push(bars.map((b, j) => {
        let barLabel = '';

        // line charts do not have labels in their meta data, access global label array instead
        if (!b._model.label) {
          barLabel = chart.data.labels[j];
        } else {
          barLabel = b._model.label;
        }
        return {
          label: barLabel,
          x: b._model.x,
          y: b._model.y,
          color: b._model.borderColor
        }
      }));
    });

    barCoords.forEach((dataset, i) => {
      dataset.forEach((b) => {
        let hasErrorBar = errorBars[i].hasOwnProperty(b.label);
        let errorBarData = null;
        if (hasErrorBar) {
          errorBarData = errorBars[i][b.label];
        }
        // hierarchical has its label attribute nested
        if (!hasErrorBar && b.label && b.label.label && errorBars[i].hasOwnProperty(b.label.label)) {
          errorBarData = errorBars[i][b.label.label];
        }

        if (errorBarData) {
          var plus = vScale.getRightValue(errorBarData.plus);
          var minus = vScale.getRightValue(errorBarData.minus);
          this._drawErrorBar(ctx, b, plus, minus, horizontal);
        }
      });
    });

    ctx.restore();
  }
};

Chart.pluginService.register(ErrorBarsPlugin);

export default ErrorBarsPlugin;
