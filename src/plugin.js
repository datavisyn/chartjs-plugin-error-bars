'use strict';

import Chart from 'chart.js';

// TODO: options: bar color, bar width

const ErrorBarsPlugin = {
  id: 'chartJsPluginErrorBars',

  _drawErrorBar(ctx, model, value) {
    ctx.save();
    ctx.strokeStyle = model.color;
    ctx.beginPath();
    ctx.moveTo(model.x, model.y);
    ctx.lineTo(model.x, model.y - value);
    ctx.moveTo(model.x - 5, model.y - value);
    ctx.lineTo(model.x + 5, model.y - value);
    ctx.stroke();
    ctx.restore();
  },

  beforeUpdate(chart) {

  },

  afterDatasetsDraw(chart, easing) {
    var yScale = chart.scales['y-axis-0'];
    var ctx = chart.ctx;
    ctx.save();

    var errorBars = chart.data.datasets.map((d) => d.errorBars);
    var barCoords = [];
    chart.data.datasets.forEach((d, i) => {
      var bars = chart.getDatasetMeta(i).data;
      barCoords.push(bars.map((b, j) => {
        let barLabel = '';

        // line charts do not have labels so the error bars cant be mapped
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
        // is not hierarchical
        let hasErrorBar = errorBars[i].hasOwnProperty(b.label);

        let errorBarData = null;
        if (hasErrorBar) {
          errorBarData = errorBars[i][b.label];
        }
        // is hierarchical
        if (!hasErrorBar && b.label && b.label.label && errorBars[i].hasOwnProperty(b.label.label)) {
          errorBarData = errorBars[i][b.label.label];
        }

        if (errorBarData) {
          var plus = yScale.getRightValue(errorBarData.plus);
          var minus = yScale.getRightValue(errorBarData.minus);

          this._drawErrorBar(ctx, b, plus);
          this._drawErrorBar(ctx, b, minus);
        }
      });
    });

    ctx.restore();
  }
};

Chart.pluginService.register(ErrorBarsPlugin);

export default ErrorBarsPlugin;
