import { AssertionError } from "assert";

function expected(what: string): never {
  throw new AssertionError({ message: "expected " + what });
}

type ObjectWithKeysAssertedValue<
  T extends Record<string, (...args: any) => any>
> = {
  [key in keyof T]: ReturnType<T[key]>;
};

function assertAnyString(x: any) {
  if (typeof x === "string") {
    return x;
  }

  expected("string");
}

function assertNumber(x: any) {
  if (typeof x == "number") {
    return x;
  }
  if (typeof x == "string") {
    const number = Number(x);
    if (!isNaN(number)) {
      return number;
    }
  }

  expected("number");
}

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
      return assertAnyString;
    }
  },
  date() {
    return (x: any) => {
      if (x instanceof Date) {
        return x;
      }
      if (typeof x === "number") {
        const date = new Date(x);
        if (!isNaN(date.valueOf())) {
          return date;
        }
      }
      if (typeof x === "string") {
        const date = new Date(x);
        if (!isNaN(date.valueOf())) {
          return date;
        }
      }
      expected("date");
    };
  },
  number() {
    return assertNumber;
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
    const possibleKeys = new Set(Object.keys(schema));
    return (x: any): ObjectWithKeysAssertedValue<T> => {
      if (typeof x !== "object") {
        expected("object");
      }

      const newObject = {};

      for (let [key, assert] of assertions) {
        try {
          newObject[key] = assert(x[key]);
        } catch (e) {
          const assertionError = e as AssertionError;
          const what = assertionError.message.slice("expected ".length);
          expected(what + " at " + key);
        }
      }

      for (let key of Object.keys(x)) {
        if (!possibleKeys.has(key)) {
          expected("to not have key " + key);
        }
      }

      return newObject as any;
    };
  },
};
