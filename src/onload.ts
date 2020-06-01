import { ModulePrototype } from "./module-factory";

export function Onload<T extends Object>(
  target: T,
  key: string | symbol,
  descriptor: TypedPropertyDescriptor<(arg?: any) => any>
) {
  const vuexModule = target.constructor as ModulePrototype;
  if (!vuexModule.__actions) {
    vuexModule.__actions = {};
  }
  // added __onload check and addition
  if (!vuexModule.__onload) {
    vuexModule.__onload = {};
  }

  if (descriptor.value) {
    vuexModule.__actions[key as string] = descriptor.value;
    vuexModule.__onload[key as string] = descriptor.value;
  }
}
