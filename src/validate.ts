import { AssertionError } from "assert";

function expected(what: string): never {
  throw new AssertionError({ message: "expected " + what });
}

type ObjectWithKeysAssertedValue<
  T extends Record<string, (...args: any) => any>
> = {
  [key in keyof T]: ReturnType<T[key]>;
};

function assertNonEmptyString(x: any) {
  if (typeof x === "string") {
    if (x.length > 0) {
      return x;
    }
  }

  expected("non-empty string");
}

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

function assertBoolean(x: any) {
  if (typeof x == "boolean") {
    return x;
  }
  expected("boolean [true or false]");
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
  nonemptyString() {
    return assertNonEmptyString;
  },
  string() {
    return assertAnyString;
  },
  stringValue<T extends string>(value: T) {
    return (x: any): T => {
      if (typeof x === "string") {
        if (x === value) {
          // @ts-ignore
          return x;
        }
      }

      expected("string with value " + JSON.stringify(value));
    };
  },
  stringEnum<T extends string>(possibleValues: Iterable<T>) {
    const set = new Set(possibleValues);
    const repr = Array.from(set).join(", ");
    return (x: any) => {
      if (typeof x === "string") {
        // @ts-ignore
        if (set.has(x)) {
          return x as T;
        }
      }

      expected("enum of " + repr);
    };
  },
  boolean() {
    return assertBoolean;
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
  nullable<T>(checker: (...args: any) => T) {
    return (x: any): T | null => {
      if (x === null) {
        return x;
      }
      return checker(x);
    };
  },
  object<T extends Record<string, (...args: any) => any>>(
    schema: T,
    allowOtherKeys = false
  ) {
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
          expected(`${what} at ${key}`);
        }
      }

      if (!allowOtherKeys) {
        for (let key of Object.keys(x)) {
          if (!possibleKeys.has(key)) {
            expected(`to not have key ${key}`);
          }
        }
      }

      return newObject as any;
    };
  },
  extends<T extends Record<string, (...args: any) => any>>(schema: T) {
    return T.object(schema, true);
  },
  anyOf<F extends (...args: any) => any>(checkers: F[]) {
    type ReturnTypeUnion = ReturnType<typeof checkers[number]>;
    if (checkers.length === 0) {
      throw new Error("union type cannot be created with 0 validators");
    }
    return (x: any): ReturnTypeUnion => {
      const expectedMessages = [];
      for (let checker of checkers) {
        try {
          return checker(x);
        } catch (e) {
          const what = e.message.slice("expected ".length);
          expectedMessages.push(what);
        }
      }
      expected(expectedMessages.join(", "));
    };
  },
};
