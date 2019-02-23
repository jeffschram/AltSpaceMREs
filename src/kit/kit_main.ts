/*!
 * Copyright (c) iwontsay/willneedit. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Actor,
    Context,
    ParameterSet,
    User
} from "@microsoft/mixed-reality-extension-sdk";

import Applet from "../Applet";
import DoorGuard from "../DoorGuard";

export default class ShowKitObj extends Applet {
    private initialized = false;

    public init(context: Context, params: ParameterSet, baseUrl: string) {
        super.init(context, params, baseUrl);
        this.context.onUserJoined(this.userjoined);
    }

    private userjoined = async (user: User) => {
        console.log(`Connection request by ${user.name} from ${user.properties.remoteAddress}`);
        DoorGuard.greeted(user.properties.remoteAddress);
        this.started();
    }

    private started = async () => {
        if (this.initialized) return;

        this.initialized = true;

        const kitObjId = this.parameter.kit as string;
        const anim = this.parameter.animate !== undefined;

        const model = await Actor.CreateFromLibrary(this.context, {
            resourceId: kitObjId,
            actor: {
                name: `Kit Model Id: ${kitObjId}`
            }
        });

        if (anim) {
            const animName = (this.parameter.animate == null) ? 'animation:0' : this.parameter.animate as string;
            model.enableAnimation(animName);
        }
    }
}