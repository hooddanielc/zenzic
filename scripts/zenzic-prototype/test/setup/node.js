global.chai = require('chai');
global.sinon = require('sinon');

global.chai.use(require('sinon-chai'));
global.chai.use(require('chai-as-promised'));

require('babel-core/register');
require('./setup')();

/*
	Uncomment the following if we are going to do dom stuff
// import simpleJSDom from 'simple-jsdom';
// simpleJSDom.install();
*/
