# Chart.js Error Bars Plugin
[![Target Discovery Platform][tdp-image]][tdp-url] [![NPM Package][npm-image]][npm-url] [![CircleCI][circleci-image]][circleci-url]

[Chart.js](http://www.chartjs.org/) plugin for adding error bars to Line-, Barcharts or hierarchical Barcharts. This plugin also works with the [Hierarchical Scale Plugin](https://github.com/datavisyn/chartjs-scale-hierarchical).

Try the demo on [Codepen](https://codepen.io/sluger/pen/YjJKYy).

![selection_037](https://user-images.githubusercontent.com/5220584/43774415-4ab5ae88-9a49-11e8-813d-48d607d45225.png)
![selection_038](https://user-images.githubusercontent.com/5220584/43774418-4d08132e-9a49-11e8-9e90-723ef91783c7.png)
![selection_039](https://user-images.githubusercontent.com/5220584/43774420-4e7d7546-9a49-11e8-8cc9-67c63de96081.png)

## Install
```bash
npm install --save chart.js chartjs-plugin-error-bars
```


## Usage
Datasets must define an `errorBars` object that contains the error bar property key (same as in the used scale) and values `plus` and `minus`. Plus values are always positive, and minus vice versa.

*Categorical scale usage:*
```javascript
  data: {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [{
      ...
      errorBars: {
        'February': {plus: 15, minus: -34},
        'March': {plus: 5, minus: -24},
        'May': {plus: 35, minus: -14},
        'June': {plus: 45, minus: -4}
      }, ...

      /* or for graded error bars

      errorBars: {
        'February': [{plus: 15, minus: -34}, {plus: 10, minus: -26}],
        'March': [{plus: 5, minus: -24}, {plus: 2, minus: -16}],
        'May': [{plus: 35, minus: -14}, {plus: 7, minus: -7}],
        'June': [{plus: 45, minus: -4}, {plus: 25, minus: -2}]
      }, ...

      */
```

corresponding TypeScript interface
```ts
interface IErrorBars {
  [label: string]: IErrorBar | IErrorBar[];
}

interface IErrorBar {
  plus: number;
  minus: number;
}
```

*Hierarchical scale plugin usage:*
```javascript
  data: {
    labels: [
      'A',
      {
        label: 'C1',
        children: ['C1.1', 'C1.2', 'C1.3', 'C1.4']
      }
    ],
    datasets: [{
      ...
      errorBars: {
        'A': {plus: 25, minus: -10},
        'C1.2': {plus: 14, minus: -15},
        'C1': {plus: 34, minus: -5}
      }, ...
  }
```

Find more [Samples](https://github.com/datavisyn/chartjs-plugin-error-bars/tree/master/samples) on Github.


## Options
```javascript
  options: {
    ...

    plugins: {
      chartJsPluginErrorBars: {
        /**
         * stroke color, or array of colors
         * @default: derived from borderColor
         */
        color: '#666',

        /**
         * bar width in pixel as number or string or bar width in percent based on the barchart bars width (max 100%), or array of such definition
         * @default 10
         */
        width: 10 | '10px' | '60%',
        
        /**
         * lineWidth as number, or as string with pixel (px) ending
         */
        lineWidth: 2 | '2px',

        /**
         * lineWidth as number, or as string with pixel (px) ending, or array of such definition
         * @default 2
         */
        lineWidth: 2 | '2px',

        /**
         * whether to interpet the plus/minus values, relative to the value itself (default) or absolute
         * @default false
         */
        absoluteValues: false
      }
    }

  ...
}
```

corresponding TypeScript interface
```ts
interface IChartJsPluginErrorBarsOptions {
  color: string | string[];
  width: (string | number) | (string | number)[];
  lineWidth: (string | number) | (string | number)[];
  absoluteValues: boolean;
}
```


## Building

```sh
npm install
npm run build
```



***

<a href="https://www.datavisyn.io"><img src="https://www.datavisyn.io/img/logos/datavisyn-logo.png" align="left" width="200px" hspace="10" vspace="6"></a>
This repository is part of the **Target Discovery Platform** (TDP). For tutorials, API docs, and more information about the build and deployment process, see the [documentation page](https://wiki.datavisyn.io).


[tdp-image]: https://img.shields.io/badge/Target%20Discovery%20Platform-Library-violet.svg 
[tdp-url]: http://datavisyn.io
[npm-image]: https://badge.fury.io/js/chartjs-plugin-error-bars.svg
[npm-url]: https://npmjs.org/package/chartjs-plugin-error-bars
[circleci-image]: https://circleci.com/gh/datavisyn/chartjs-plugin-error-bars.svg?style=shield
[circleci-url]: https://circleci.com/gh/datavisyn/chartjs-plugin-error-bars
