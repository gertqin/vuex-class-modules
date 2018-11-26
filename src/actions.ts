import { VuexClassModule } from "./module-factory";

export function Action<T>(
  target: T,
  key: string | symbol,
  descriptor: TypedPropertyDescriptor<(arg?: any) => Promise<void>>
) {
  const vuexModule = target.constructor as VuexClassModule;
  if (!vuexModule.__actions) {
    vuexModule.__actions = {};
  }
  if (descriptor.value) {
    vuexModule.__actions[key as string] = descriptor.value;
  }
}
