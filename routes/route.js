import indexRoute from './getIndex.js';
import overviewRoute from './getOverview.js';
import detailsRoute from './getDetails.js';
import postMessageRoute from './postMessage.js';

export default function(app) {
  app.use('/', indexRoute);
  app.use('/', detailsRoute);
  app.use('/', postMessageRoute);
  app.use('/', overviewRoute);
}