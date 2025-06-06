import indexRoute from './getIndex.js';
import overviewRoute from './getOverview.js';
import detailsRoute from './getDetails.js';

export default function(app) {
  app.use('/', indexRoute);
  app.use('/', detailsRoute);
  app.use('/', overviewRoute);
}