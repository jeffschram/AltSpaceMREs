/*!
 * Copyright (c) iwontsay/willneedit. All rights reserved.
 * Licensed under the MIT License.
 */

import { User } from "@microsoft/mixed-reality-extension-sdk";
import got = require("got");
import SGAddressing, { SGLocationData } from "./addressing";

/*
 * Provides services for self-location within different realms. So far, only Altspace is supported.
 *
 * Discovered location string formats:
 * Altspace:
 *  - World: space/<spaceid>
 *  - World (legacy, with SID): <space_sid>
 *  - Event: event/<eventid>
 *  NOTE: Uses plural form (spaces/events) for addressing using URLs (both web and app startup)
 *        and singular (space/event) when using in-app teleportation
 *
 * Sansar:
 *  - World: experience/<userid>/<spaceid>
 *  - Event: event/<userid>/<eventid>/<eventinstanceid> (UNVERIFIED)
 * NOTE: Uses plural form (experiences/events) for addressing using web description URLs,
 *       singular when using app startup URLs,
 *       can use app startup URLs for in-app teleportation ( AgentPrivate.Client.TeleportToUri() ) (UNVERIFIED)
 */
export default class SGLocator {

    private static locationMap: { [loc: string]: string } = { };

    /**
     * Return the legacy space SID from Altspace which matches the given space ID
     * @param location Altspace's numeric space ID
     */
    public static async lookupAltspaceLegacySpaceSID(location: string) {

        // Cache the lookup to avoid unneccessary traffic
        if (this.locationMap[location]) return this.locationMap[location];

        const apiURL = 'http://account.altvr.com/api/spaces/' +
            location.substr(5);
        const spaceSid = await got(apiURL, { json: true }).then(response => {
            // FIXME: Gratious assumption about the returned structure
            return response.body.spaces[0].space_sid;
        }).catch(err => '');

        this.locationMap[location] = spaceSid;
        return spaceSid;
    }

    /**
     * Returns the Altspace's numeric space ID when called with an entering user
     * @param user The user object, as seen in onUserJoined()
     */
    public static locateInAltspace(user: User) {
        let location = '';
        if (user.properties["altspacevr-event-id"]) {
            location = 'event/' + user.properties["altspacevr-event-id"];
        } else if (user.properties["altspacevr-space-id"]) {
            location = 'space/' + user.properties["altspacevr-space-id"];
        }

        return location;
    }

    /**
     * Try to find the location data for the object seen by the specific Altspace user or
     * return the preliminary address (usable for registration) when it's not in the network
     * @param user The user object, as seen in onUserJoined()
     */
    public static async lookupMeInAltspace(user: User, base: number): Promise<SGLocationData> {
        let location = this.locateInAltspace(user);
        const sgld = await SGAddressing.lookupGateAddress(location, base, 1).catch(async (err) => {
            // Save the location string in the error response, in case even the legacy lookup fails
            err.location = location;
            location = await this.lookupAltspaceLegacySpaceSID(location);
            return SGAddressing.lookupGateAddress(location, base, 1).catch((err2) => err);
        });

        return sgld;
    }

    /**
     * Returns the URL needed for the app startup for the given world
     *  - Sansar special case: Also for in-app teleportation
     * @param location In-Galaxy location string
     * @param gid Galaxy ID
     */
    public static translateToURL(location: string, gid: number) {
        if (gid === 1) {
            // Legacy location strings don't have a space or event directive.
            // No idea how to distinguish between those two.
            if (location.substr(0, 5) !== 'space/' && location.substr(0, 5) !== 'event/') {
                location = "space/" + location;
            }

            // Altspace: Translate 'event' to 'events' and 'space' to 'spaces' and decorate
            return "altspace://account.altvr.com/api/" +
                location.substr(0, 5) + "s" +
                location.substr(5);
        } else if (gid === 2) {
            // Use as-is and decorate;
            return "sansar://sansar.com/" + location;
        }

        return location;

    }
}
