import { AssertionError } from "assert";

function expected(what: string): never {
  throw new AssertionError({ message: "expected " + what });
}

type ObjectWithKeysAssertedValue<
  T extends Record<string, (...args: any) => any>
> = {
  [key in keyof T]: ReturnType<T[key]>;
};

export const T = {
  exact<V>(value: V) {
    return (x: any): V => {
      if (x !== value) {
        expected("exact value " + value);
      }
      return x;
    };
  },
  string(value?: string) {
    if (value) {
      return (x: any) => {
        if (typeof x === "string") {
          return x;
        }

        expected("string with value " + JSON.stringify(value));
      };
    } else {
      return (x: any) => {
        if (typeof x === "string") {
          return x;
        }

        expected("string");
      };
    }
  },
  date() {
    return (x: any) => {
      if (x instanceof Date) {
        return x;
      }
      if (typeof x === "number") {
        const date = new Date(x);
        if (isNaN(date.valueOf())) {
          expected("date");
        }
        return date;
      }
      if (typeof x === "string") {
        const date = new Date(x);
        if (isNaN(date.valueOf())) {
          expected("date");
        }
        return date;
      }
    };
  },
  number() {
    return (x: any) => {
      if (typeof x != "number") {
        expected("number");
      }
      return x;
    };
  },
  optional<T>(checker: (...args: any) => T) {
    return (x: any): T | undefined => {
      if (x === undefined) {
        return x;
      }
      return checker(x);
    };
  },
  objectWithKeys<T extends Record<string, (...args: any) => any>>(schema: T) {
    const assertions = Object.entries(schema);
    return (x: any): ObjectWithKeysAssertedValue<T> => {
      if (typeof x !== "object") {
        expected("object");
      }

      const existingKeys = Object.keys(x);
      if (assertions.length !== existingKeys.length) {
        expected("object with entries");
      }

      const hasProperty = Object.prototype.hasOwnProperty.bind(x);

      for (let [key, assert] of assertions) {
        if (!hasProperty(key)) {
          expected("object with key " + key);
        }
        assert(x[key]);
      }

      for (let key of existingKeys) {
        if (!(key in assertions)) {
          expected("to not have key " + key);
        }
      }

      return x;
    };
  },
};
