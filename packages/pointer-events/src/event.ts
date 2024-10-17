import { BaseEvent, Face, Object3D, Quaternion, Ray, Raycaster, Vector2, Vector3 } from 'three'
import { Intersection as ThreeIntersection } from './intersections/index.js'
import { Pointer } from './pointer.js'
import { getObjectListeners } from './utils.js'
import type { Camera, IntersectionEvent, Intersection } from '@react-three/fiber/dist/declarations/src/core/events.js'
import { HtmlEvent, Properties } from './html-event.js'

export type PointerEventsMap = {
  [Key in keyof PointerEventsHandlers as EventHandlerToEventName<Key>]-?: PointerEventsHandlers[Key]
}

export type EventHandlerToEventName<T> = T extends `on${infer K}` ? Lowercase<K> : never

export type PointerEventsHandlers = {
  onPointerMove?: PointerEvent
  onPointerCancel?: PointerEvent
  onPointerDown?: PointerEvent
  onPointerUp?: PointerEvent
  onPointerEnter?: PointerEvent
  onPointerLeave?: PointerEvent
  onPointerOver?: PointerEvent
  onPointerOut?: PointerEvent
  onClick?: PointerEvent<MouseEvent>
  onDblClick?: PointerEvent<MouseEvent>
  onContextMenu?: PointerEvent<MouseEvent>
  onWheel?: WheelEvent
}

export type NativeEvent = {
  timeStamp: number
  button?: number
}

const helperVector = new Vector3()

export class PointerEvent<E extends NativeEvent = globalThis.PointerEvent>
  extends HtmlEvent<E>
  implements
    ThreeIntersection,
    BaseEvent<keyof PointerEventsMap>,
    IntersectionEvent<E>,
    Properties<
      Omit<
        globalThis.PointerEvent | globalThis.MouseEvent | globalThis.WheelEvent,
        'target' | 'currentTarget' | 'srcElement'
      >
    >
{
  //--- pointer events data
  get pointerId(): number {
    return this.internalPointer.id
  }
  get pointerType(): string {
    return this.internalPointer.type
  }
  get pointerState(): any {
    return this.internalPointer.state
  }

  //--- intersection data
  get distance(): number {
    return this.intersection.distance
  }
  get distanceToRay(): number | undefined {
    return this.intersection.distanceToRay
  }
  get point(): Vector3 {
    return this.intersection.point
  }
  get index(): number | undefined {
    return this.intersection.index
  }
  get face(): Face | null | undefined {
    return this.intersection.face
  }
  get faceIndex(): number | undefined {
    return this.intersection.faceIndex
  }
  get uv(): Vector2 | undefined {
    return this.intersection.uv
  }
  get uv1(): Vector2 | undefined {
    return this.intersection.uv1
  }
  get normal(): Vector3 | undefined {
    return this.intersection.normal
  }
  get instanceId(): number | undefined {
    return this.intersection.instanceId
  }
  get pointOnLine(): Vector3 | undefined {
    return this.intersection.pointOnLine
  }
  get batchId(): number | undefined {
    return this.intersection.batchId
  }
  get pointerPosition(): Vector3 {
    return this.intersection.pointerPosition
  }
  get pointerQuaternion(): Quaternion {
    return this.intersection.pointerQuaternion
  }
  get pointOnFace(): Vector3 {
    return this.intersection.pointOnFace
  }
  get localPoint(): Vector3 {
    return this.intersection.localPoint
  }
  get details(): ThreeIntersection['details'] {
    return this.intersection.details
  }

  /** same as object */
  get target(): Object3D {
    return this.object
  }
  /** same as currentObject */
  get currentTarget(): Object3D {
    return this.currentObject
  }
  /** same as currentObject */
  get eventObject(): Object3D {
    return this.currentObject
  }
  /** same as object */
  get srcElement(): Object3D {
    return this.currentObject
  }

  constructor(
    public readonly type: keyof PointerEventsMap,
    public readonly bubbles: boolean,
    nativeEvent: E,
    protected internalPointer: Pointer,
    protected readonly intersection: ThreeIntersection,
    public readonly camera: Camera,
    public readonly currentObject: Object3D = intersection.object,
    public readonly object: Object3D = currentObject,
    private readonly propagationState: { stopped: boolean; stoppedImmediate: boolean } = {
      stopped: !bubbles,
      stoppedImmediate: false,
    },
  ) {
    super(nativeEvent)
  }

  get pointer(): Vector2 {
    helperVector.copy(this.intersection.point).project(this.camera)
    return new Vector2(helperVector.x, helperVector.y)
  }

  get ray(): Ray {
    switch (this.intersection.details.type) {
      case 'camera-ray':
      case 'ray':
      case 'sphere':
        return new Ray(
          this.intersection.pointerPosition,
          new Vector3(0, 0, -1).applyQuaternion(this.intersection.pointerQuaternion),
        )
      case 'lines':
        return new Ray(
          this.intersection.details.line.start,
          this.intersection.details.line.end.clone().sub(this.intersection.details.line.start).normalize(),
        )
    }
  }

  get intersections(): Intersection[] {
    return [{ ...this.intersection, eventObject: this.currentObject }]
  }

  get unprojectedPoint(): Vector3 {
    const p = this.pointer
    return new Vector3(p.x, p.y, 0).unproject(this.camera)
  }

  get stopped(): boolean {
    return this.propagationState.stoppedImmediate || this.propagationState.stopped
  }

  get stoppedImmediate(): boolean {
    return this.propagationState.stoppedImmediate
  }

  get delta(): number {
    throw new Error(`not supported`)
  }

  stopPropagation(): void {
    this.propagationState.stopped = true
  }
  stopImmediatePropagation(): void {
    this.propagationState.stoppedImmediate = true
  }

  /**
   * for internal use
   */
  retarget(currentObject: Object3D) {
    return new PointerEvent(
      this.type,
      this.bubbles,
      this.nativeEvent,
      this.internalPointer,
      this.intersection,
      this.camera,
      currentObject,
      this.target,
      this.propagationState,
    )
  }
}

export type NativeWheelEvent = {
  deltaX: number
  deltaY: number
  deltaZ: number
} & NativeEvent

export class WheelEvent extends PointerEvent<NativeWheelEvent> {
  get deltaX(): number {
    return this.nativeEvent.deltaX
  }

  get deltaY(): number {
    return this.nativeEvent.deltaY
  }

  get deltaZ(): number {
    return this.nativeEvent.deltaZ
  }

  constructor(
    nativeEvent: NativeWheelEvent,
    pointer: Pointer,
    intersection: ThreeIntersection,
    camera: Camera,
    currentObject?: Object3D,
    object?: Object3D,
  ) {
    super('wheel', true, nativeEvent, pointer, intersection, camera, currentObject, object)
  }

  /**
   * for internal use
   */
  retarget(currentObject: Object3D) {
    return new WheelEvent(
      this.nativeEvent,
      this.internalPointer,
      this.intersection,
      this.camera,
      currentObject,
      this.target,
    )
  }
}

export function emitPointerEvent(event: PointerEvent<NativeEvent>) {
  emitPointerEventRec(event, event.currentObject)
}

function emitPointerEventRec(baseEvent: PointerEvent<NativeEvent>, currentObject: Object3D | null) {
  if (currentObject == null) {
    return
  }
  const listeners = getObjectListeners(currentObject, baseEvent.type)
  if (listeners != null && listeners.length > 0) {
    const event = baseEvent.retarget(currentObject)
    const length = listeners.length
    for (let i = 0; i < length && !event.stoppedImmediate; i++) {
      listeners[i](event)
    }
  }
  if (baseEvent.stopped) {
    return
  }
  emitPointerEventRec(baseEvent, currentObject.parent)
}
