/* eslint-disable no-use-before-define */

// Import
import Errlop from 'errlop'
import fetch from 'node-fetch'
import versionCompare from 'version-compare'

/**
 * A significant version number of a Node.js schedule.
 * @example `"4"`
 * @example `"0.12"`
 */
export type NodeScheduleIdentifier = string

/**
 * A significant version number of a Node.js schedule.
 * @example `4`
 * @example `"4"`
 * @example `0.12`
 * @example `"0.12"`
 */
export type NodeScheduleInput = string | number

/** The meta information of a Node.js schedule. */
export interface NodeScheduleInformation {
	/** the significant version number */
	version: NodeScheduleIdentifier

	/** the date this scheduled version is expected to be first released */
	start: Date

	/** the date this scheduled version is expected to reach end of life */
	end: Date

	/** the date this scheduled version is expected to become LTS */
	lts?: Date

	/** the date this scheduled version is expected to reach maintenance phase */
	maintenance?: Date

	/** the LTS codename for this scheduled version, if applicable */
	codename?: string
}

/** The URL of the Node.js schedule API. */
const url =
	'https://raw.githubusercontent.com/nodejs/Release/master/schedule.json'

/**
 * The raw response from the Node.js schedule.
 * @see https://github.com/nodejs/Release
 */
interface NodeScheduleResponse {
	[version: string]: {
		start: string
		end: string
		lts?: string
		maintenance?: string
		codename?: string
	}
}

/**
 * The Node.js schedule, as a Map of a schedule version number to its parsed schedule information.
 * Sorted by the version number chronologically (e.g. 0.8, 0.12, 4).
 */
type NodeScheduleMap = Map<NodeScheduleIdentifier, NodeScheduleInformation>

/** The fetched {@link NodeScheduleMap} */
const nodeScheduleMap: NodeScheduleMap = new Map<
	NodeScheduleIdentifier,
	NodeScheduleInformation
>()

/**
 * The Node.js schedule, as an Array of its schedule version numbers.
 * Sorted by the version number chronologically (e.g. 0.8, 0.12, 4).
 */
export type NodeScheduleIdentifiers = Array<NodeScheduleIdentifier>

/** The fetched {@link NodeScheduleIdentifiers} */
const nodeScheduleIdentifiers: NodeScheduleIdentifiers = []

/**
 * Fetch the Node.js schedule from the API.
 */
export async function preloadNodeSchedule(): Promise<void> {
	if (nodeScheduleIdentifiers.length) return
	try {
		// fetch the node.js release schedule
		const response = await fetch(url, {})
		const json: NodeScheduleResponse = await response.json()

		// parse it, then sort it, then add it
		const results: Array<NodeScheduleInformation> = []
		for (const [key, meta] of Object.entries(json)) {
			// parse
			const version = key.replace('v', '')
			const start = new Date(meta.start)
			const end = new Date(meta.end)
			let maintenance: Date | undefined, lts: Date | undefined
			if (meta.maintenance) maintenance = new Date(meta.maintenance)
			if (meta.lts) lts = new Date(meta.lts)
			// push for sorting, then adding
			results.push({
				version,
				start,
				end,
				maintenance,
				lts,
				codename: meta.codename,
			})
		}

		// sort
		results.sort((a, b) => versionCompare(a.version, b.version))

		// add
		for (const meta of results) {
			nodeScheduleMap.set(meta.version, meta)
			nodeScheduleIdentifiers.push(meta.version)
		}
	} catch (err) {
		throw new Errlop(
			`Failed to fetch the Node.js schedule information of the API: ${url}`,
			err
		)
	}
}

// @note we don't allow access to the map directly, as its a API waste of time, as do they want the details as an array, or as a keyed object, or as a map array, or as map? Too much complexity.

/**
 * Get from the cache the Node.js schedule information for a specific Node.js schedule version.
 * Requires {@link preloadNodeSchedule} to have been previously awaited, otherwise use {@link preloadNodeSchedule} instead.
 * @returns an immutable copy of the schedule information
 */
export function getNodeScheduleInformation(
	version: NodeScheduleInput
): NodeScheduleInformation {
	// fetch
	const info = nodeScheduleMap.get(String(version))
	// check
	if (!info) {
		if (nodeScheduleIdentifiers.length === 0)
			throw new Error(
				`Unable to get the schedule information for Node.js version [${JSON.stringify(
					version
				)}] as the cache was empty.\nFetch first, then try again.`
			)
		throw new Error(
			`Unable to find the schedule information for Node.js version [${JSON.stringify(
				version
			)}] in the cache.\nCheck the version number is valid and try again.\nVersion numbers that do exist are: [${nodeScheduleIdentifiers.join(
				', '
			)}]`
		)
	}
	// return
	return { ...info }
}

/**
 * Get from the cache the Node.js schedule version numbers.
 * Requires {@link fetchNodeVersions} to have been previously awaited.
 * @returns immutable array of {@link nodeScheduleIdentifiers}
 */
export function getNodeScheduleIdentifiers(): NodeScheduleIdentifiers {
	if (nodeScheduleIdentifiers.length) return nodeScheduleIdentifiers.slice()
	throw new Error(`Node.js nodeScheduleIdentifiers have not yet been fetched.`)
}
