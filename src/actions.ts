import { ModulePrototype } from "./module-factory";

export function Action<T extends Object>(
  target: T,
  key: string | symbol,
  descriptor: TypedPropertyDescriptor<(arg?: any) => any>
) {
  const vuexModule = target.constructor as ModulePrototype;
  if (!vuexModule.__actions) {
    vuexModule.__actions = {};
  }
  if (descriptor.value) {
    vuexModule.__actions[key as string] = descriptor.value;
  }
}
