import { VuexClassModule } from "./module-factory";

export function Mutation<T>(target: T, key: string | symbol, descriptor: TypedPropertyDescriptor<(arg?: any) => void>) {
  const vuexModule = target.constructor as VuexClassModule;
  if (!vuexModule.__mutations) {
    vuexModule.__mutations = {};
  }
  if (descriptor.value) {
    vuexModule.__mutations[key as string] = descriptor.value;
  }
}
