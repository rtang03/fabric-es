import { FTCreateParameters, FTSchemaField } from 'redis-modules-sdk';

type Car = {
  id: string;
  price: string;
  Brand: string;
};

type IndexedObject<T> = {
  index<K extends string & keyof T>(
    key: `${Lowercase<K>}Idx`,
    callback: (newValue: T[K]) => void
  ): void;
};

declare function test_only<T>(obj: T): T & IndexedObject<T>;

const car = test_only<Partial<Car>>({
  id: 'id',
  Brand: 'br',
  price: 'pr',
});

car.index('idIdx', (newValue) => {
  console.log(newValue);
});
car.index('priceIdx', (newValue) => {
  console.log(newValue);
});

type CustomFTSchemaField<T> = {
  [K in keyof T as `${Lowercase<string & K>}`]?: () => FTSchemaField;
};

type HashFields<T> = {
  [K in keyof T as `${Lowercase<string & K>}`]?: (item: T) => any;
};

type CarSchema = CustomFTSchemaField<Car>;
type CarHashFields = HashFields<Car>;

const carHashFields: CarHashFields = {
  id: (car) => car.id,
  price: (car) => car.price,
  brand: (car) => car.Brand,
};

const computeHashFields = (entity) =>
  Object.entries<(item) => any>(carHashFields).map(([key, fcn]) => [key, fcn(entity)]);

const result = computeHashFields(car);

type Fcn<T> = () => T;

type Indexes<K = any> = {
  getSchema: () => CustomFTSchemaField<K>;
};

const MemoCar: <T>(entity: T) => Indexes<T> = <T>(entity) => {
  return {
    getSchema: () => null,
  };
};

const schema: CarSchema = {
  id: () => ({ name: 'id', type: 'TEXT', sortable: true }),
  brand: () => ({ name: 'id', type: 'TEXT', sortable: true }),
};

const getFTCreateParam: (entityName: string) => FTCreateParameters = (entityName) => ({
  prefix: [{ count: 1, name: `e:${entityName}` }],
});

const getEntityHashFields: <TEntity>(entity) => any = (entity) => null;
