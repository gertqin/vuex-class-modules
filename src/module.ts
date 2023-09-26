import { VuexClassModuleFactory, ModuleOptions, IVuexModule } from "./module-factory";
import { VuexModule } from "./VuexModule";

type VuexModuleClass = new (...args: any[]) => VuexModule;
export function Module<T extends VuexModuleClass>(target: T): T;
export function Module(options?: ModuleOptions): ClassDecorator;
export function Module<T extends VuexModuleClass>(arg?: ModuleOptions | T): ClassDecorator | T {
  if (typeof arg === "function") {
    return moduleDecoratorFactory()(arg) as T;
  } else {
    return moduleDecoratorFactory(arg);
  }
}

function moduleDecoratorFactory(moduleOptions?: ModuleOptions) {
  return <TFunction extends Function>(constructor: TFunction): TFunction => {
    const accessor: any = function (...args: any[]) {
      const instance = new constructor.prototype.constructor(...args) as IVuexModule;
      Object.setPrototypeOf(instance, accessor.prototype);

      const factory = new VuexClassModuleFactory(constructor, instance, moduleOptions || {});

      factory.registerVuexModule();

      const accessorModule = factory.buildAccessor();
      accessorModule.created?.();

      return accessorModule;
    };
    accessor.prototype = Object.create(constructor.prototype);
    accessor.prototype.constructor = accessor;
    return accessor;
  };
}
