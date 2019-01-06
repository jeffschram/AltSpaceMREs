/*!
 * Copyright (c) iwontsay/willneedit. All rights reserved.
 * Licensed under the MIT License.
 */

import Applet from "../Applet";

// tslint:disable:max-classes-per-file
export enum GateStatus {
    idle,
    dialing,
    engaged,
    incoming,
    despawned
}

export abstract class StargateLike extends Applet {
    public abstract startDialing(sequence: number[]): void;
    public abstract lightIncoming(chevron: number): void;
    public abstract engageIncoming(srcId: string): void;
    public abstract disengage(): void;
    public abstract get gateStatus(): GateStatus;
    public abstract registerGate(id: string): void;
    public abstract get id(): string;
}

export abstract class SGDialCompLike extends Applet {
    public abstract updateStatus(message: string): void;
    public abstract registerDC(id: string): void;
    public abstract get id(): string;
}

export class StargateDespawned extends StargateLike {
    public startDialing(sequence: number[]): void { }
    public lightIncoming(chevron: number): void { }
    public engageIncoming(srcId: string): void { }
    public disengage(): void { }
    public get gateStatus(): GateStatus { return GateStatus.despawned; }
    public registerGate(id: string): void { }
    public get id(): string { return undefined; }
    public get sessID(): string { return undefined; }
}