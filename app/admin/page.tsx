"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getState,
  updateState,
  type UserRecord,
  type AppState,
} from "@/lib/utils";

export default function AdminPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [form, setForm] = useState<Partial<UserRecord>>({ role: "tendero" });
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    setState(getState());
  }, []);

  const users = useMemo(() => {
    if (!state) return [];
    const list = state.users;
    if (!filter) return list;
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(filter.toLowerCase()) ||
        u.email.toLowerCase().includes(filter.toLowerCase())
    );
  }, [state, filter]);

  const addUser = () => {
    if (!form.name || !form.email || !form.password || !form.role) {
      alert(
        "Por favor completa los campos obligatorios: Nombre, Email, Contraseña y Rol"
      );
      return;
    }

    // Normalizar y validar email
    const normalizedEmail = form.email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      alert("Por favor ingresa un email válido");
      return;
    }

    const emailExists = state?.users.some((u) => u.email.toLowerCase().trim() === normalizedEmail);
    if (emailExists) {
      alert("Ya existe un usuario con ese email");
      return;
    }

    const newUser: UserRecord = {
      id: crypto.randomUUID(),
      name: form.name!,
      email: normalizedEmail,
      password: form.password!,
      role: form.role,
      phone: form.phone,
      storeName: form.role === "tendero" ? form.storeName : undefined,
      address: form.role === "proveedor" ? form.address : undefined,
      description: form.role === "proveedor" ? form.description : undefined,
      businessName: form.role === "proveedor" ? form.businessName : undefined,
    };
    const next = updateState((s) => ({ ...s, users: [...s.users, newUser] }));
    setState(next);
    setForm({ role: "tendero" });
    alert(`Usuario ${newUser.name} creado exitosamente!`);
  };

  const removeUser = (id: string) => {
    const next = updateState((s) => ({
      ...s,
      users: s.users.filter((u) => u.id !== id),
    }));
    setState(next);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Administración de Usuarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selector de Rol primero */}
            <div>
              <Label className="text-base font-semibold">
                Tipo de Usuario *
              </Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  type="button"
                  variant={form.role === "tendero" ? "default" : "outline"}
                  onClick={() => setForm(prev => ({ ...prev, role: "tendero" }))}
                >
                  Tendero
                </Button>
                <Button
                  type="button"
                  variant={form.role === "proveedor" ? "default" : "outline"}
                  onClick={() => setForm(prev => ({ ...prev, role: "proveedor" }))}
                >
                  Proveedor
                </Button>
                <Button
                  type="button"
                  variant={form.role === "admin" ? "default" : "outline"}
                  onClick={() => setForm(prev => ({ ...prev, role: "admin" }))}
                >
                  Admin
                </Button>
              </div>
            </div>

            {/* Campos comunes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre Completo *</Label>
                <Input
                  placeholder="Ej: Juan Pérez"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Contraseña *</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 4 caracteres"
                  value={form.password || ""}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  type="tel"
                  placeholder="+57 300 123 4567"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {/* Campos específicos para TENDERO */}
              {form.role === "tendero" && (
                <div className="md:col-span-2">
                  <Label>Nombre de la Tienda</Label>
                  <Input
                    placeholder="Ej: Tienda Don Pepe"
                    value={form.storeName || ""}
                    onChange={(e) =>
                      setForm({ ...form, storeName: e.target.value })
                    }
                  />
                </div>
              )}

              {/* Campos específicos para PROVEEDOR */}
              {form.role === "proveedor" && (
                <>
                  <div className="md:col-span-2">
                    <Label>Nombre del Negocio/Empresa</Label>
                    <Input
                      placeholder="Ej: Distribuidora López S.A."
                      value={form.businessName || ""}
                      onChange={(e) =>
                        setForm({ ...form, businessName: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Dirección</Label>
                    <Input
                      placeholder="Ej: Av. Principal 123, Ciudad"
                      value={form.address || ""}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descripción del Negocio</Label>
                    <Input
                      placeholder="Ej: Distribuidora de productos alimenticios"
                      value={form.description || ""}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <Button onClick={addUser} className="w-full" size="lg">
              Crear Usuario
            </Button>

            <div className="mt-6">
              <Label>Buscar</Label>
              <Input
                placeholder="Buscar por nombre o email"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>

            <div className="grid gap-3 mt-4">
              {users.map((u) => (
                <Card key={u.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">{u.name}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                            {u.role}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {u.email}
                        </div>
                        {u.phone && (
                          <div className="text-sm text-muted-foreground">
                            📞 {u.phone}
                          </div>
                        )}
                        {u.storeName && (
                          <div className="text-sm text-muted-foreground">
                            🏪 {u.storeName}
                          </div>
                        )}
                        {u.businessName && (
                          <div className="text-sm font-medium text-primary">
                            🏢 {u.businessName}
                          </div>
                        )}
                        {u.address && (
                          <div className="text-sm text-muted-foreground">
                            📍 {u.address}
                          </div>
                        )}
                        {u.description && (
                          <div className="text-sm text-muted-foreground italic">
                            "{u.description}"
                          </div>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeUser(u.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron usuarios
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
