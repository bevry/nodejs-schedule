// remote
import { deepEqual, equal, log } from 'assert-helpers'
import kava from 'kava'
import versionCompare from 'version-compare'

// local
import {
	preloadNodeSchedule,
	getNodeScheduleIdentifiers,
	getNodeScheduleInformation,
} from './index.js'

kava.suite('@bevry/nodejs-schedule', function (suite, test) {
	test('preload', function (done) {
		preloadNodeSchedule()
			.then(() => done())
			.catch(done)
	})
	suite('getNodeScheduleIdentifiers', function (suite, test) {
		const actual = getNodeScheduleIdentifiers()
		log(actual)
	})
	test('sort order is chronological version numbers', function () {
		const actual = getNodeScheduleIdentifiers()
		const sorted = actual.slice().sort(versionCompare)
		equal(actual.join(', '), sorted.join(', '), 'sort order is oldest first')
	})
	test('getNodeScheduleInformation', function () {
		const result = getNodeScheduleInformation('4')
		log(result)
	})
	test('getNodeScheduleInformation', function () {
		log(getNodeScheduleInformation('4'))
	})
	test('getNodeScheduleInformation for insignificant version numbers', function () {
		log(getNodeScheduleInformation('4.0.0'))
		log(getNodeScheduleInformation('4.0'))
		log(getNodeScheduleInformation('0.12.0'))
		log(getNodeScheduleInformation('0.8.0'))
	})
	test('getSchedules', function () {
		log(getNodeScheduleIdentifiers().map((v) => getNodeScheduleInformation(v)))
		// can log, as is not huge
	})
	suite('is immutable array', function (suite, test) {
		const mutated = getNodeScheduleIdentifiers()
		mutated.push('changed')
		const source = getNodeScheduleIdentifiers()
		equal(
			mutated.length,
			source.length + 1,
			'the lengths of the arrays should not be the same, as the source array should remain immutable',
		)
	})
	suite('is immutable object', function (suite, test) {
		const mutated = getNodeScheduleInformation('4')
		mutated.version = '4-mutated'
		const source = getNodeScheduleInformation('4')
		equal(
			mutated.version,
			'4-mutated',
			'mutation should have been applied to the mutable returned object',
		)
		equal(
			source.version,
			'4',
			'however the mutation should not have been applied to the source object',
		)
	})
})
