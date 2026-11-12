// Sin dependencias nuevas: ejecuta los hooks y handlers con estado/red simulados.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(relative, mocks = {}) {
  const source = fs.readFileSync(
    path.join(__dirname, "../src", relative),
    "utf8",
  );
  const context = {
    exports: {},
    TextEncoder,
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      return require(name);
    },
  };
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2021,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    context,
  );
  return context.exports;
}
const policy = load("lib/password-policy.ts");
function setup(create) {
  const states = [];
  let index = 0;
  const errors = [];
  const react = {
    useState(initial) {
      const id = index++;
      if (!(id in states)) states[id] = initial;
      return [
        states[id],
        (value) => {
          states[id] = typeof value === "function" ? value(states[id]) : value;
        },
      ];
    },
  };
  const usuarios = {
    creando: false,
    crear: create,
    setError: (value) => errors.push(value),
  };
  const module = load("hooks/use-usuario-form.ts", {
    react,
    "@/hooks/use-usuarios": { useUsuarios: () => usuarios },
    "@/lib/password-policy": policy,
  });
  return {
    errors,
    render() {
      index = 0;
      return module.useUsuarioForm();
    },
  };
}
function fill(setup, password) {
  const form = setup.render();
  form.setUsuario("prueba");
  form.setNombre("Prueba");
  form.setPassword(password);
  return setup.render();
}
const event = () => ({ preventDefault() {} });
function elements(node) {
  if (!node || typeof node !== "object") return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(elements)];
}

test("rechaza localmente una contraseña corta sin enviar", async () => {
  let calls = 0;
  const state = setup(async () => {
    calls++;
  });
  await fill(state, "corta").onSubmit(event());
  assert.equal(calls, 0);
  assert.match(state.render().passwordError, /12 caracteres/);
});
test("conserva datos y visibilidad mientras espera y tras un error", async () => {
  let reject;
  const state = setup(
    () =>
      new Promise((_, no) => {
        reject = no;
      }),
  );
  const form = fill(state, "  frase de prueba  ");
  form.toggleMostrarPassword();
  const pending = state.render().onSubmit(event());
  assert.equal(state.render().password, "  frase de prueba  ");
  reject(new Error("error simulado"));
  await pending;
  assert.equal(state.render().password, "  frase de prueba  ");
  assert.equal(state.render().usuario, "prueba");
});
test("envía la contraseña intacta y limpia solamente después del éxito", async () => {
  let resolve;
  let sent;
  const state = setup((input) => {
    sent = input;
    return new Promise((yes) => {
      resolve = yes;
    });
  });
  const form = fill(state, "  frase de prueba  ");
  form.toggleMostrarPassword();
  const pending = state.render().onSubmit(event());
  assert.equal(sent.password, "  frase de prueba  ");
  assert.equal(state.render().password, sent.password);
  resolve();
  await pending;
  assert.equal(state.render().password, "");
  assert.equal(state.render().usuario, "");
  assert.equal(state.render().mostrarPassword, false);
});
test("botón accesible alterna visibilidad sin enviar ni cambiar el valor", () => {
  let submissions = 0;
  const state = setup(async () => {
    submissions++;
  });
  fill(state, "frase de prueba");
  const { UsuarioForm } = load("components/admin/UsuarioForm.tsx", {
    "lucide-react": { Loader2: "span", UserPlus: "span" },
    "@/types/trabajador": { ROLES_UI: [{ value: "cajero", label: "Cajero" }] },
  });
  const render = () => elements(UsuarioForm({ form: state.render() }));
  let tree = render();
  const input = () => tree.find((node) => node.props?.id === "nuevo-password");
  const toggle = () =>
    tree.find(
      (node) =>
        node.type === "button" &&
        node.props["aria-controls"] === "nuevo-password",
    );
  assert.equal(input().props.type, "password");
  assert.equal(input().props.autoComplete, "new-password");
  assert.equal(input().props.onPaste, undefined);
  assert.equal(toggle().props.type, "button");
  assert.equal(toggle().props.tabIndex, undefined);
  assert.equal(toggle().props.children, "Mostrar contraseña");
  toggle().props.onClick();
  tree = render();
  assert.equal(input().props.type, "text");
  assert.equal(toggle().props["aria-pressed"], true);
  toggle().props.onClick();
  tree = render();
  assert.equal(input().props.type, "password");
  assert.equal(submissions, 0);
  assert.equal(state.render().password, "frase de prueba");
});
test("errores locales se asocian al campo y se limpian al editar", async () => {
  const state = setup(async () => undefined);
  await fill(state, "corta").onSubmit(event());
  assert.ok(state.render().passwordError);
  state.render().setPassword("una frase válida");
  assert.equal(state.render().passwordError, null);
});
test("muestra listas de validación del backend y conserva mensajes simples", () => {
  class ApiError extends Error {
    constructor(message, data) {
      super(message);
      this.data = data;
    }
  }
  const errors = [];
  let options;
  const { useUsuarios } = load("hooks/use-usuarios.ts", {
    react: { useState: () => [null, (value) => errors.push(value)] },
    "@tanstack/react-query": {
      useQueryClient: () => ({ invalidateQueries() {} }),
      useQuery: () => ({ data: [] }),
      useMutation: (config) => {
        if (!options) options = config;
        return { mutateAsync() {}, mutate() {} };
      },
    },
    sonner: { toast: { success() {}, error() {} } },
    "@/services/auth.service": { AuthService: {} },
    "@/services/api": { ApiError, getErrorMessage: (error) => error.message },
  });
  useUsuarios();
  options.onError(
    new ApiError("genérico", { message: ["Requisito A.", "Requisito B."] }),
  );
  assert.equal(errors.at(-1), "Requisito A. Requisito B.");
  options.onError(
    new ApiError("Usuario existente", { message: "Usuario existente" }),
  );
  assert.equal(errors.at(-1), "Usuario existente");
});

// Regresiones de la segunda mejora, usando el hook sin red ni DOM real.
for (const [label, status, data, network, expected] of [
  [
    "429",
    429,
    { retryAfterSeconds: 12.2 },
    false,
    "Demasiados intentos. Espera 13 segundos antes de volver a intentarlo.",
  ],
  [
    "429 sin tiempo",
    429,
    null,
    false,
    "Demasiados intentos. Espera 60 segundos antes de volver a intentarlo.",
  ],
  ["401", 401, null, false, "Usuario o contraseña incorrectos."],
  [
    "red",
    0,
    null,
    true,
    "Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.",
  ],
  [
    "inesperado",
    500,
    null,
    false,
    "No se pudo iniciar sesión. Intenta de nuevo.",
  ],
  ["correcto", 200, null, false, null],
])
  test(`regresión login: ${label}`, async () => {
    class ApiError extends Error {
      constructor() {
        super();
        this.status = status;
        this.data = data;
      }
    }
    const state = [];
    let index = 0;
    const mockFormData = class {
      get(key) {
        return key;
      }
    };
    const source = fs.readFileSync(
      path.join(__dirname, "../src/hooks/use-login.ts"),
      "utf8",
    );
    const ctx = {
      exports: {},
      FormData: mockFormData,
      require(name) {
        if (name === "react")
          return {
            useState: (initial) => {
              const id = index++;
              state[id] = initial;
              return [
                initial,
                (value) => {
                  state[id] = value;
                },
              ];
            },
          };
        if (name.includes("session-context"))
          return {
            useSessionContext: () => ({
              login: async () => {
                if (status === 200) return {};
                if (status === 401) return null;
                if (network) throw new TypeError();
                throw new ApiError();
              },
            }),
          };
        return {
          ApiError,
          esErrorDeRed: (error) => error instanceof TypeError,
        };
      },
    };
    vm.runInNewContext(
      ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      }).outputText,
      ctx,
    );
    await ctx.exports.useLogin().onSubmit({ ...event(), currentTarget: {} });
    assert.equal(state[0], expected);
    assert.equal(state[1], false);
  });
