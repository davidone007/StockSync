"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import {
  getState,
  updateState,
  type AppState,
  type UserRecord,
  type Sale,
  type SaleItem,
  type Purchase,
  loadBarcodeDataset,
} from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScanLine,
  Package,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  Store,
  Edit,
  Users,
  User,
  TrendingUp,
  LogOut,
  Camera,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Upload,
  X,
  Check,
  Megaphone,
  Send,
} from "lucide-react";

// Dataset local de códigos (se carga desde /data/barcodes.json)
type BarcodeDbEntry = { name: string; price?: number; image?: string };

// Proveedores por defecto eliminados por requerimiento

type UserType = "tendero" | "proveedor" | "admin" | null;
type BarcodeDb = Record<string, BarcodeDbEntry>;

// Categorías de productos
const PRODUCT_CATEGORIES = [
  "Bebidas",
  "Snacks y Dulces",
  "Lácteos",
  "Carnes y Embutidos",
  "Frutas y Verduras",
  "Panadería",
  "Granos y Cereales",
  "Enlatados y Conservas",
  "Aseo Personal",
  "Aseo del Hogar",
  "Congelados",
  "Aceites y Condimentos",
  "Galletas y Repostería",
  "Productos para Bebé",
  "Medicamentos y Salud",
  "Licores",
  "Cigarrillos",
  "Otros",
] as const;

export default function StockSyncApp() {
  const [loggedInUser, setLoggedInUser] = useState<UserRecord | null>(null);
  const [barcodeDb, setBarcodeDb] = useState<BarcodeDb | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginUserType, setLoginUserType] = useState<UserType>("tendero");
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    userType: "tendero" as UserType,
    storeName: "",
    phone: "",
  });
  const [validationMessage, setValidationMessage] = useState("");
  const [validationType, setValidationType] = useState<
    "success" | "error" | ""
  >("");

  const [supplierProfile, setSupplierProfile] = useState({
    name: "Distribuidora López",
    businessName: "Distribuidora López S.A.",
    phone: "+52123456789",
    email: "contacto@distribuidoralopez.com",
    address: "Av. Principal 123, Ciudad",
    description: "",
  });
  const [editingSupplierProfile, setEditingSupplierProfile] = useState(false);

  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [editingSupplierProduct, setEditingSupplierProduct] =
    useState<any>(null);
  const [addingSupplierProduct, setAddingSupplierProduct] = useState(false);
  const [newSupplierProduct, setNewSupplierProduct] = useState({
    name: "",
    barcode: "",
    price: 0,
    stock: 0,
    minStock: 0,
    description: "",
    discount: 0,
    category: "",
    image: "",
  });

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: 0,
    minStock: 0,
    discount: 0,
    category: "",
    image: "",
  });

  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("inventory");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [confirmScanOpen, setConfirmScanOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  // Ref para el lector de códigos (ZXing) y para bloquear reentradas de barcode
  const codeReaderRef = useRef<any | null>(null);
  const handledBarcodeRef = useRef<string | null>(null);
  const isDecodingRef = useRef<boolean>(false);
  // Contador para diagnóstico
  const startScanningCountRef = useRef<number>(0);

  // Modal para producto existente
  const [existingProductModal, setExistingProductModal] = useState(false);
  const [existingProductData, setExistingProductData] = useState<any>(null);
  const [existingProductQty, setExistingProductQty] = useState<string>("1");

  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    barcode: "",
    category: "",
    stock: 0,
    minStock: 0,
    price: 0,
    image: "",
    description: "",
    discount: 0,
  });
  const [productImage, setProductImage] = useState<File | null>(null);

  const [showAllSuppliers, setShowAllSuppliers] = useState(false);

  const [supplierAnnouncements, setSupplierAnnouncements] = useState<any[]>([]);
  const [addingAnnouncement, setAddingAnnouncement] = useState(false);
  const [selectedProductsForAnnouncement, setSelectedProductsForAnnouncement] =
    useState<number[]>([]);

  // Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<UserRecord | null>(
    null
  );
  const [chatMessage, setChatMessage] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);

  // States for adding products from offers
  const [selectedOfferProduct, setSelectedOfferProduct] = useState<any>(null);
  const [offerProductQuantity, setOfferProductQuantity] = useState(1);
  const [addingFromOfferModal, setAddingFromOfferModal] = useState(false);

  // States for billing system
  const [salesCart, setSalesCart] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [historyFilter, setHistoryFilter] = useState("all"); // all, today, week, month
  const [showSaleReceipt, setShowSaleReceipt] = useState(false);
  const [currentSaleReceipt, setCurrentSaleReceipt] = useState<Sale | null>(null);
  const [stockUpdateTrigger, setStockUpdateTrigger] = useState(0);

  const generateUniqueCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `PROD-${timestamp}-${random}`;
  };

  const showValidation = (message: string, type: "success" | "error") => {
    setValidationMessage(message);
    setValidationType(type);
    setTimeout(() => {
      setValidationMessage("");
      setValidationType("");
    }, 3000);
  };

  // Get stock status color
  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0)
      return {
        color: "bg-red-500",
        text: "Sin Stock",
        textColor: "text-red-600",
      };
    if (stock <= minStock)
      return {
        color: "bg-amber-500",
        text: "Stock Bajo",
        textColor: "text-amber-600",
      };
    return {
      color: "bg-green-500",
      text: "En Stock",
      textColor: "text-green-600",
    };
  };

  // Filter products based on search
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm)
  );

  // Get low stock products
  const lowStockProducts = products.filter(
    (product) => product.stock <= product.minStock
  );

  // Update product stock
  const updateStock = (productId: number, change: number) => {
    setProducts((prev) => {
      const next = prev.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(0, product.stock + change) }
          : product
      );
    const saved = updateState((s) => ({ ...s, products: next }));
    setAppState(saved);
    setStockUpdateTrigger(prev => prev + 1); // Trigger update
    return next;
  });
};  const startScanning = async () => {
    try {
      console.log("🎬 Iniciando scanner...");

      // Evitar inicializar múltiples veces el decoder
      if (isDecodingRef.current) {
        console.log("Scanner ya inicializado, evitando doble inicio");
        return;
      }
      // Marcar inmediatamente que estamos inicializando para evitar races
      isDecodingRef.current = true;

      // Incrementar contador para diagnóstico
      startScanningCountRef.current += 1;
      console.log(
        `🔢 startScanning llamado ${startScanningCountRef.current} veces`
      );

      // Detener cualquier stream previo
      if (stream) {
        console.log("⏹️ Deteniendo stream previo");
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsScanning(true);
      setScanResult(null);
      setDetectedProduct(null);
      setCapturedPhoto(null);
      setStream(null);

      console.log("📱 Solicitando acceso a cámara...");

      // Solicitar acceso a la cámara - intenta múltiples configuraciones
      let mediaStream;
      try {
        // Intenta primero con constraints específicas
        console.log("Intento 1: Con constraints específicas");
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        console.log("✅ Intento 1 exitoso");
      } catch (e1) {
        console.warn("❌ Intento 1 fallido:", e1);
        try {
          // Intenta sin constraints específicas
          console.log("Intento 2: Sin constraints específicas");
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          console.log("✅ Intento 2 exitoso");
        } catch (e2) {
          console.error("❌ Ambos intentos fallidos:", e1, e2);
          throw new Error(
            "No hay cámara disponible. Asegúrate de conectar una cámara o permitir acceso en navegador."
          );
        }
      }

      console.log("🎥 Conectando stream al video elemento...");

      // Conectar el stream al video
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);

        console.log("▶️ Iniciando reproducción de video...");

        // Esperar a que el video esté realmente listo
        const playPromise = videoRef.current.play();
        if (playPromise) {
          await playPromise.catch((e) => {
            console.error("❌ Error al reproducir video:", e);
            throw e;
          });
        }

        console.log("✅ Video reproduciéndose");
      }

      console.log("🔍 Importando scanner de códigos...");

      // Importar y configurar el escáner
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const codeReader = new BrowserMultiFormatReader();
      // Guardar instancia para poder resetearla desde stopScanning
      codeReaderRef.current = codeReader;

      console.log("🔍 Iniciando escaneo continuo...");

      // Dar tiempo para que el video se estabilice
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Usar listeners para detección continua
      let scannerActive = true;

      const scannerListener = (result: any) => {
        if (result && scannerActive) {
          const text = result.getText();
          console.log(
            `🔍 Listener activado para: ${text}, handledBarcodeRef: ${handledBarcodeRef.current}, scannerActive: ${scannerActive}`
          );

          // Evitar procesar el mismo código múltiples veces
          if (handledBarcodeRef.current === text) {
            console.log(`🚫 Código ${text} ya manejado en listener, ignorando`);
            return;
          }

          // NO marcar como manejado aquí, se hace en handleBarcodeDetected
          console.log("✅ Código detectado:", text);

          // Detener inmediatamente el scanner para evitar más eventos
          scannerActive = false;

          // Resetear el decoder para detener eventos
          try {
            codeReaderRef.current?.reset?.();
            console.log("🔄 codeReader reset desde listener");
          } catch (e) {
            console.warn("Error resetting codeReader:", e);
          }

          // Actualizar estado de UI
          setScanResult(text);
          setConfirmScanOpen(true);

          // Detener completamente el scanning
          stopScanning();
          isDecodingRef.current = false;
        }
      };

      const errorListener = (error: any) => {
        // Silenciar errores de "no barcode found"
        if (error && error.name !== "NotFoundException") {
          console.log("Scanner error:", error.name);
        }
      };

      // Iniciar escaneo continuo
      try {
        codeReader.decodeFromVideoElement(
          videoRef.current!,
          scannerListener
        );
      } catch (e) {
        console.error("Error en decodificación:", e);
        // Fallback a método alternativo
        const scan = async () => {
          if (!videoRef.current || !isScanning || !scannerActive) return;

          try {
            const result = await codeReader.decodeOnceFromVideoElement(
              videoRef.current
            );
            if (result && scannerActive) {
              const text = result.getText();
              console.log(
                `🔍 Fallback activado para: ${text}, handledBarcodeRef: ${handledBarcodeRef.current}, scannerActive: ${scannerActive}`
              );

              // Evitar procesar el mismo código múltiples veces
              if (handledBarcodeRef.current === text) {
                console.log(
                  `🚫 Código ${text} ya manejado en fallback, ignorando`
                );
                return;
              }

              // NO marcar como manejado aquí, se hace en handleBarcodeDetected
              console.log("✅ Código detectado (fallback):", text);

              // Detener inmediatamente
              scannerActive = false;

              // Actualizar UI
              setScanResult(text);
              setConfirmScanOpen(true);

              // Resetear y detener
              try {
                codeReaderRef.current?.reset?.();
                console.log("🔄 codeReader reset desde fallback");
              } catch (e) {
                console.warn("Error resetting codeReader (fallback):", e);
              }

              stopScanning();
              isDecodingRef.current = false;
              return;
            }
          } catch (err) {
            // No se detectó código, continuar
          }

          // Continuar escaneando solo si aún está activo
          if (scannerActive && isScanning) {
            setTimeout(scan, 100);
          }
        };

        scan();
      }
    } catch (error: any) {
      console.error("❌ Error general:", error);
      toast.error(
        `Cámara no disponible: ${
          error.message || "Verifica los permisos o conecta una cámara"
        }`
      );
      setIsScanning(false);
      // Limpiar flag de inicialización para permitir reintentos
      isDecodingRef.current = false;
    }
  };

  const stopScanning = () => {
    console.log("🛑 stopScanning llamado");
    setIsScanning(false);

    // Detener stream y limpiar recursos
    try {
      // Resetear el lector si existe
      try {
        codeReaderRef.current?.reset?.();
        console.log("🔄 codeReader reset llamado");
      } catch (e) {
        console.warn("Error resetting codeReader on stop:", e);
      }
      codeReaderRef.current = null;

      if (stream) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
            stream.removeTrack(track);
          } catch (e) {
            console.warn("Error stopping track:", e);
          }
        });
      }

      // Limpiar video element
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }

      setStream(null);
      // Asegurar que el flag de decodificación se limpie
      isDecodingRef.current = false;
      console.log("✅ stopScanning completado");
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
  };

  useEffect(() => {
    // Limpiar cámara cuando se cambie de pestaña o al desmontar
    const cleanup = () => {
      if (isScanning) {
        stopScanning();
      }
    };

    if (activeTab !== "scan") {
      cleanup();
    }

    // Limpiar al desmontar el componente
    return cleanup;
  }, [activeTab, isScanning]);

  // Solo una vez al montar - Cargar estado inicial
  useEffect(() => {
    // Cargar el estado de la app primero (necesario para login)
    const st = getState();
    setAppState(st);
    
    // Luego intentar recuperar usuario guardado
    const savedUser = localStorage.getItem("loggedInUser");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setLoggedInUser(user);
      } catch (e) {
        console.error("Error parsing saved user:", e);
      }
    }
  }, []);

  // Cargar datos cuando el usuario cambia o el stock se actualiza
  useEffect(() => {
    if (!loggedInUser) return;

    // Cargar estado app (usuarios, productos, anuncios)
    const st = getState();
    setAppState(st);
    setProducts(st.products);
    setSupplierProducts(st.supplierProducts);
    setConversations(st.chats || []);
    setSales(st.sales || []);
    setPurchases(st.purchases || []);

    // Si hay usuario logueado, cargar su información
    if (loggedInUser.role === "proveedor") {
      setSupplierProfile({
        name: loggedInUser.name,
        businessName: loggedInUser.businessName || loggedInUser.name,
        phone: loggedInUser.phone || "",
        email: loggedInUser.email,
        address: loggedInUser.address || "",
        description: loggedInUser.description || "",
      });

      // Load supplier's own offers from global state
      const supplierOffers = st.supplierOffers?.filter(
        (offer) => offer.supplierId === loggedInUser.id && offer.isActive
      ) || [];
      
      // Convert to local announcement format for UI compatibility
      const localAnnouncements = supplierOffers.map((offer) => ({
        id: offer.id,
        products: offer.products,
        createdAt: offer.createdAt,
      }));
      
      setSupplierAnnouncements(localAnnouncements);
    } else if (loggedInUser.role === "tendero") {
      // Load all active offers for tenderos to see
      const allActiveOffers = st.supplierOffers?.filter(offer => offer.isActive) || [];
      setSupplierAnnouncements(allActiveOffers.map((offer) => ({
        id: offer.id,
        products: offer.products,
        createdAt: offer.createdAt,
        supplier: {
          name: offer.supplierName,
          businessName: offer.supplierBusinessName,
          phone: offer.supplierPhone,
          email: offer.supplierEmail,
        },
      })));
    }

    // Cargar dataset: merge de localStorage + /data/barcodes.json
    const localDb = loadBarcodeDataset();
    fetch("/data/barcodes.json")
      .then((r) => r.json())
      .then((list: Array<{ barcode: string } & BarcodeDbEntry>) => {
        const map: BarcodeDb = { ...localDb };
        list.forEach((e) => {
          if (!map[e.barcode])
            map[e.barcode] = { name: e.name, price: e.price, image: e.image };
        });
        setBarcodeDb(map);
      })
      .catch(() => setBarcodeDb(localDb as BarcodeDb));
  }, [loggedInUser?.id, stockUpdateTrigger]); // Solo cuando cambia el usuario o se fuerza la actualización

  // Limpiar stream cuando se desmonta
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.error("Error stopping track:", e);
          }
        });
      }
    };
  }, [stream]);

  // Detener escaneo cuando se cierra el modal de confirmación
  useEffect(() => {
    if (!confirmScanOpen && isScanning) {
      console.log("Modal cerrado, deteniendo escaneo");
      stopScanning();
    }
    // Si se cerró el modal de confirmación, permitir nuevos códigos
    if (!confirmScanOpen) {
      console.log("🔓 Limpiando handledBarcodeRef al cerrar confirmScanOpen");
      handledBarcodeRef.current = null;
    }
  }, [confirmScanOpen]);

  // Limpiar handled flag al cerrar modal de producto existente
  useEffect(() => {
    if (!existingProductModal) {
      console.log(
        "🔓 Limpiando handledBarcodeRef al cerrar existingProductModal"
      );
      handledBarcodeRef.current = null;
    }
  }, [existingProductModal]);

  const handleBarcodeDetected = async (barcode: string) => {
    console.log(
      `📥 handleBarcodeDetected llamado con: ${barcode}, handledBarcodeRef: ${handledBarcodeRef.current}`
    );

    // BLOQUEO CRÍTICO: Evitar procesar el mismo código múltiples veces
    if (handledBarcodeRef.current === barcode) {
      console.log(
        `🚫 Código ${barcode} ya está siendo manejado, ignorando llamada duplicada`
      );
      return;
    }

    // Marcar como manejado INMEDIATAMENTE para bloquear otras llamadas concurrentes
    handledBarcodeRef.current = barcode;
    console.log(`🔒 Código ${barcode} marcado como manejado`);

    // Buscar en inventario existente
    const existing = products.find((p) => p.barcode === barcode);
    if (existing) {
      console.log(`📦 Producto existente encontrado: ${existing.name}`);
      // Detener escaneo antes de abrir el modal para evitar bucle
      stopScanning();
      // Mostrar modal para agregar cantidad al producto existente
      if (!existingProductModal) {
        console.log(`🔓 Abriendo modal de producto existente`);
        setExistingProductData(existing);
        setExistingProductQty("1");
        setExistingProductModal(true);
      } else {
        console.log(
          `⚠️ Modal de producto existente ya está abierto, ignorando`
        );
      }
      return;
    }

    // Dataset local
    const local = barcodeDb?.[barcode];
    if (local) {
      console.log(`📚 Producto encontrado en dataset local: ${local.name}`);
      const product = {
        id: Date.now(),
        name: local.name,
        barcode,
        stock: 1,
        minStock: 5,
        price: local.price || 0,
        image: local.image || "/placeholder.svg",
      };
      setProducts((prev) => {
        const next = [...prev, product];
        const saved = updateState((s) => ({ ...s, products: next }));
        setAppState(saved);
        return next;
      });
      setDetectedProduct(product.name);
      toast.success(`Producto ${product.name} agregado al inventario`);
      return;
    }

    // Fallback: Open Food Facts (preferir CO)
    try {
      console.log(`🌐 Buscando en Open Food Facts: ${barcode}`);
      const off = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      ).then((r) => r.json());
      if (off?.product) {
        console.log(`📚 Producto encontrado en Open Food Facts`);
        const name =
          off.product.product_name ||
          off.product.brands ||
          `Producto ${barcode}`;
        const image = off.product.image_front_small_url || "/placeholder.svg";
        const product = {
          id: Date.now(),
          name,
          barcode,
          stock: 1,
          minStock: 5,
          price: 0,
          image,
        };
        setProducts((prev) => {
          const next = [...prev, product];
          const saved = updateState((s) => ({ ...s, products: next }));
          setAppState(saved);
          return next;
        });
        setDetectedProduct(product.name);
        toast.success(`${product.name} agregado al inventario`);
        return;
      }
    } catch (error) {
      console.error("Error fetching from Open Food Facts:", error);
    }

    // Si no se encontró EN NINGÚN LADO, abrir modal para agregar manualmente
    console.log(
      `❌ Código ${barcode} no encontrado en ningún lado, mostrando modal de nuevo producto`
    );
    stopScanning();

    // Preparar datos para el modal de agregar producto
    setNewProduct({
      name: "",
      barcode: barcode,
      category: "",
      stock: 1,
      minStock: 5,
      price: 0,
      image: "",
      description: "",
      discount: 0,
    });
    setProductImage(null);
    setCapturedPhoto(null);

    // Mostrar toast informativo
    toast.info(`Código ${barcode} no encontrado. Agregando nuevo producto...`);

    // Abrir el modal de agregar producto
    setAddingProduct(true);
  };

  const takePhotoFromVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = captureCanvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedPhoto(dataUrl);
  };

  // Authentication functions
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!email.trim() || !password.trim()) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    // Normalizar email antes de comparar
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = appState?.users.find(
      (u) => u.email.toLowerCase().trim() === normalizedEmail && u.password === password
    );

    if (user) {
      setLoggedInUser(user);
      localStorage.setItem("loggedInUser", JSON.stringify(user)); // Guardar usuario
      toast.success(`Bienvenido de nuevo, ${user.name}`);
    } else {
      toast.error("Credenciales incorrectas. Por favor intente de nuevo.");
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem("loggedInUser"); // Eliminar usuario al salir
    toast.info("Has cerrado sesión");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones mejoradas
    if (!registerForm.name.trim()) {
      toast.error("Por favor ingrese su nombre completo");
      return;
    }

    if (!registerForm.email.trim()) {
      toast.error("Por favor ingrese su correo electrónico");
      return;
    }

    // Normalizar y validar formato de email
    const normalizedEmail = registerForm.email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast.error("Por favor ingrese un correo electrónico válido");
      return;
    }

    if (!registerForm.password || registerForm.password.length < 4) {
      toast.error("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    if (!registerForm.phone.trim()) {
      toast.error("Por favor ingrese su número de teléfono");
      return;
    }

    if (registerForm.userType === "tendero" && !registerForm.storeName.trim()) {
      toast.error("Por favor ingrese el nombre de su tienda");
      return;
    }

    const st = getState();
    const exists = st.users.some((u) => u.email.toLowerCase().trim() === normalizedEmail);
    if (exists) {
      toast.error("Ya existe un usuario con ese correo electrónico");
      return;
    }

    const newUser: UserRecord = {
      id: crypto.randomUUID(),
      name: registerForm.name.trim(),
      email: normalizedEmail,
      password: registerForm.password,
      role: (registerForm.userType as any) || "tendero",
      storeName: registerForm.storeName?.trim(),
      phone: registerForm.phone.trim(),
    };

    const saved = updateState((s) => ({
      ...s,
      users: [...s.users, newUser],
      currentUserId: newUser.id,
    }));
    setAppState(saved);
    setLoggedInUser(newUser);
    localStorage.setItem("loggedInUser", JSON.stringify(newUser));
    toast.success(`¡Cuenta creada exitosamente! Bienvenido ${newUser.name}`);

    if (newUser.role === "tendero") setActiveTab("inventory");

    // Limpiar el formulario
    setRegisterForm({
      name: "",
      email: "",
      password: "",
      userType: "tendero",
      storeName: "",
      phone: "",
    });
  };

  const saveSupplierProfile = () => {
    if (!appState?.currentUserId) return;

    const saved = updateState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === appState.currentUserId
          ? {
              ...u,
              name: supplierProfile.name,
              businessName: supplierProfile.businessName,
              phone: supplierProfile.phone,
              email: supplierProfile.email,
              address: supplierProfile.address,
              description: supplierProfile.description,
            }
          : u
      ),
    }));

    setAppState(saved);
    setEditingSupplierProfile(false);
    toast.success("Perfil actualizado exitosamente");
  };

  // Product editing functions
  const startEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price,
      minStock: product.minStock,
      discount: product.discount || 0,
      category: product.category || "",
      image: product.image || "",
    });
  };

  const saveProductEdit = () => {
    setProducts((prev) => {
      const next = prev.map((product) =>
        product.id === editingProduct.id ? { ...product, ...editForm } : product
      );
      const saved = updateState((s) => ({ ...s, products: next }));
      setAppState(saved);
      return next;
    });
    setEditingProduct(null);
  };

  const addManualProduct = () => {
    const newId = Math.max(...products.map((p) => p.id)) + 1;
    const productToAdd = {
      ...newProduct,
      id: newId,
      image: "/diverse-products-still-life.png",
    };
    setProducts((prev) => {
      const next = [...prev, productToAdd as any];
      const saved = updateState((s) => ({ ...s, products: next }));
      setAppState(saved);
      return next;
    });
    setNewProduct({
      name: "",
      barcode: "",
      category: "",
      price: 0,
      stock: 0,
      minStock: 0,
      image: "",
      description: "",
      discount: 0,
    });
    setAddingProduct(false);
  };

  const addSupplierProduct = () => {
    // Validaciones
    if (!newSupplierProduct.name.trim()) {
      toast.error("Por favor ingrese el nombre del producto");
      return;
    }

    if (!newSupplierProduct.price || newSupplierProduct.price <= 0) {
      toast.error("Por favor ingrese un precio válido");
      return;
    }

    if (!newSupplierProduct.category.trim()) {
      toast.error("Por favor ingrese la categoría del producto");
      return;
    }

    const newId =
      supplierProducts.length > 0
        ? Math.max(...supplierProducts.map((p) => p.id)) + 1
        : 1;

    const productToAdd = {
      ...newSupplierProduct,
      id: newId,
      barcode: newSupplierProduct.barcode || `SUP-${Date.now()}`,
      image: newSupplierProduct.image || "/diverse-products-still-life.png",
      stock: newSupplierProduct.stock || 0,
      minStock: newSupplierProduct.minStock || 0,
      ownerUserId: appState?.currentUserId,
      catalogType: "proveedor" as const,
    };

    setSupplierProducts((prev) => {
      const next = [...prev, productToAdd as any];
      const saved = updateState((s) => ({ ...s, supplierProducts: next }));
      setAppState(saved);
      return next;
    });

    setNewSupplierProduct({
      name: "",
      barcode: "",
      price: 0,
      stock: 0,
      minStock: 0,
      description: "",
      discount: 0,
      category: "",
      image: "",
    });

    setAddingSupplierProduct(false);
    toast.success(`Producto "${productToAdd.name}" agregado exitosamente`);
  };

  const saveSupplierProductEdit = () => {
    setSupplierProducts((prev) => {
      const next = prev.map((product) =>
        product.id === editingSupplierProduct.id
          ? { ...product, ...editForm }
          : product
      );
      const saved = updateState((s) => ({ ...s, supplierProducts: next }));
      setAppState(saved);
      return next;
    });
    setEditingSupplierProduct(null);
  };

  const deleteProduct = (productId: number) => {
    setProducts((prev) => {
      const productToDelete = prev.find((p) => p.id === productId);
      const next = prev.filter((product) => product.id !== productId);
      const saved = updateState((s) => ({ ...s, products: next }));
      setAppState(saved);

      // Si el producto eliminado tenía un código escaneado, limpiar el ref
      // para permitir volver a escanear ese código
      if (
        productToDelete &&
        handledBarcodeRef.current === productToDelete.barcode
      ) {
        console.log(
          `🔓 Limpiando handledBarcodeRef al eliminar producto: ${productToDelete.barcode}`
        );
        handledBarcodeRef.current = null;
      }

      return next;
    });
    toast.success("Producto eliminado correctamente");
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.barcode) {
      toast.error("Por favor complete el nombre y el código de barras");
      return;
    }

    if (!newProduct.category) {
      toast.error("Por favor seleccione una categoría");
      return;
    }

    if (!newProduct.stock || !newProduct.minStock) {
      toast.error("Por favor complete el stock actual y el stock mínimo");
      return;
    }

    // Check if barcode already exists
    const barcodeExists = products.some(
      (p) => p.barcode === newProduct.barcode
    );
    if (barcodeExists) {
      toast.error("Ya existe un producto con este código de barras");
      return;
    }

    if (newProduct.stock < 0 || newProduct.minStock < 0) {
      toast.error("Las cantidades no pueden ser negativas");
      return;
    }

    const product = {
      id: Date.now(),
      name: newProduct.name,
      barcode: newProduct.barcode,
      category: newProduct.category,
      stock: newProduct.stock,
      minStock: newProduct.minStock,
      price: newProduct.price || 0,
      image: newProduct.image || "/placeholder.svg",
      description: newProduct.description || "",
      discount: newProduct.discount || 0,
      ownerUserId: loggedInUser?.id,
      catalogType: "tendero" as const,
    };

    setProducts((prev) => {
      const next = [...prev, product];
      const saved = updateState((s) => ({ ...s, products: next }));
      setAppState(saved);
      return next;
    });

    setNewProduct({
      name: "",
      barcode: "",
      category: "",
      stock: 0,
      minStock: 0,
      price: 0,
      image: "",
      description: "",
      discount: 0,
    });
    setProductImage(null);
    setAddingProduct(false);
    toast.success(`✅ ${product.name} agregado correctamente al inventario`);
  };

  const createAnnouncement = () => {
    if (selectedProductsForAnnouncement.length === 0) {
      toast.error("Seleccione al menos un producto para publicar");
      return;
    }

    if (!loggedInUser || loggedInUser.role !== "proveedor") {
      toast.error("Solo los proveedores pueden crear ofertas");
      return;
    }

    const productsToPublish = supplierProducts.filter((p) =>
      selectedProductsForAnnouncement.includes(p.id)
    );

    // Create a global supplier offer
    const newOffer = {
      id: crypto.randomUUID(),
      supplierId: loggedInUser.id,
      supplierName: loggedInUser.name,
      supplierBusinessName: loggedInUser.businessName,
      supplierPhone: loggedInUser.phone,
      supplierEmail: loggedInUser.email,
      products: productsToPublish,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    // Save to global state
    const updatedState = updateState((s) => ({
      ...s,
      supplierOffers: [...s.supplierOffers, newOffer],
    }));
    setAppState(updatedState);

    // Also keep local announcement for UI compatibility
    const newAnnouncement = {
      id: newOffer.id, // Use the same ID as the global offer
      products: productsToPublish,
      createdAt: new Date().toISOString(),
    };

    setSupplierAnnouncements((prev) => [...prev, newAnnouncement]);
    setSelectedProductsForAnnouncement([]);
    setAddingAnnouncement(false);
    toast.success("Oferta publicada correctamente y visible para todos los tenderos");
  };

  const deleteAnnouncement = (announcementId: string | number) => {
    if (!loggedInUser || loggedInUser.role !== "proveedor") {
      toast.error("Solo los proveedores pueden eliminar sus ofertas");
      return;
    }

    // Remove from global offers
    const updatedState = updateState((s) => ({
      ...s,
      supplierOffers: s.supplierOffers.filter(
        (offer) => offer.id !== announcementId.toString() || offer.supplierId !== loggedInUser.id
      ),
    }));
    setAppState(updatedState);

    // Remove from local announcements
    setSupplierAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    
    toast.success("Oferta eliminada correctamente");
  };

  const getPublishedProducts = () => {
    const allProducts: any[] = [];
    supplierAnnouncements.forEach((announcement) => {
      allProducts.push(...announcement.products);
    });
    return allProducts;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showValidation("La imagen no puede ser mayor a 5MB", "error");
        return;
      }
      // Convertir a base64 y guardar en newProduct.image
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewProduct((prev) => ({
          ...prev,
          image: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
      setProductImage(file);
    }
  };

  const startEditSupplierProduct = (product: any) => {
    setEditingSupplierProduct(product);
    setEditForm({
      name: product.name,
      price: product.price,
      minStock: product.minStock,
      discount: product.discount || 0,
      category: product.category || "",
      image: product.image || "",
    });
  };

  // Chat functions
  const getOrCreateConversation = (otherUserId: string) => {
    const currentUserId = appState?.currentUserId;
    if (!currentUserId) return null;

    let conversation = conversations.find(
      (c) =>
        (c.participant1Id === currentUserId &&
          c.participant2Id === otherUserId) ||
        (c.participant1Id === otherUserId && c.participant2Id === currentUserId)
    );

    if (!conversation) {
      conversation = {
        id: crypto.randomUUID(),
        participant1Id: currentUserId,
        participant2Id: otherUserId,
        messages: [],
        lastMessageAt: new Date().toISOString(),
      };
      setConversations((prev) => {
        const next = [...prev, conversation];
        const saved = updateState((s) => ({ ...s, chats: next }));
        setAppState(saved);
        return next;
      });
    }

    return conversation;
  };

  const sendMessage = () => {
    if (!chatMessage.trim() || !selectedChatUser || !appState?.currentUserId)
      return;

    const conversation = getOrCreateConversation(selectedChatUser.id);
    if (!conversation) return;

    const newMessage = {
      id: crypto.randomUUID(),
      senderId: appState.currentUserId,
      receiverId: selectedChatUser.id,
      message: chatMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    const updatedMessages = [...conversation.messages, newMessage];

    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === conversation.id
          ? {
              ...c,
              messages: updatedMessages,
              lastMessageAt: newMessage.timestamp,
            }
          : c
      );
      const saved = updateState((s) => ({ ...s, chats: next }));
      setAppState(saved);
      return next;
    });

    setChatMessage("");
    toast.success("Mensaje enviado");
  };

  const getCurrentConversation = () => {
    if (!selectedChatUser || !appState?.currentUserId) return null;
    return conversations.find(
      (c) =>
        (c.participant1Id === appState.currentUserId &&
          c.participant2Id === selectedChatUser.id) ||
        (c.participant1Id === selectedChatUser.id &&
          c.participant2Id === appState.currentUserId)
    );
  };

  const getUnreadCount = () => {
    if (!appState?.currentUserId) return 0;
    let count = 0;
    conversations.forEach((conv) => {
      conv.messages.forEach((msg: any) => {
        if (msg.receiverId === appState.currentUserId && !msg.read) {
          count++;
        }
      });
    });
    return count;
  };

  // Function to add products from supplier offers to shopkeeper inventory
  const addProductFromOffer = (offerProduct: any, quantity: number = 1) => {
    if (!loggedInUser || loggedInUser.role !== "tendero") {
      toast.error("Solo los tenderos pueden agregar productos a su inventario");
      return;
    }

    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    // Find the offer this product belongs to
    const relatedOffer = appState?.supplierOffers.find(offer => 
      offer.products.some(p => p.id === offerProduct.id)
    );

    // Check if product already exists in shopkeeper's inventory (by barcode)
    const existingProductIndex = products.findIndex(
      (p) => p.barcode === offerProduct.barcode
    );

    if (existingProductIndex !== -1) {
      // Product exists, increase quantity
      const updatedProducts = [...products];
      updatedProducts[existingProductIndex] = {
        ...updatedProducts[existingProductIndex],
        stock: updatedProducts[existingProductIndex].stock + quantity,
      };

      setProducts(updatedProducts);
      const saved = updateState((s) => ({ ...s, products: updatedProducts }));
      setAppState(saved);

      // Force re-render
      setStockUpdateTrigger(prev => prev + 1);

      toast.success(
        `✅ Se agregaron ${quantity} unidades de ${offerProduct.name} al inventario existente`
      );
    } else {
      // Product doesn't exist, create new
      const newProduct = {
        id: Date.now(),
        name: offerProduct.name,
        barcode: offerProduct.barcode,
        category: offerProduct.category || "Sin categoría",
        stock: quantity,
        minStock: offerProduct.minStock || 5,
        price: offerProduct.price,
        image: offerProduct.image || "/placeholder.svg",
        description: offerProduct.description || "",
        discount: offerProduct.discount || 0,
        ownerUserId: loggedInUser.id,
        catalogType: "tendero" as const,
      };

      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      const saved = updateState((s) => ({ ...s, products: updatedProducts }));
      setAppState(saved);

      // Force re-render
      setStockUpdateTrigger(prev => prev + 1);

      toast.success(
        `✅ ${offerProduct.name} agregado al inventario con ${quantity} unidades`
      );
    }

    // Register the purchase if we found the related offer
    if (relatedOffer) {
      const purchaseItem: SaleItem = {
        productId: offerProduct.id,
        productName: offerProduct.name,
        quantity,
        unitPrice: offerProduct.price,
        discount: offerProduct.discount || 0,
        subtotal: quantity * offerProduct.price * (1 - (offerProduct.discount || 0) / 100)
      };

      registerPurchaseFromOffer(
        relatedOffer.id,
        relatedOffer.supplierName,
        relatedOffer.supplierId,
        [purchaseItem],
        purchaseItem.subtotal
      );
    }
  };

  // Function to handle selecting a product from an offer
  const handleSelectOfferProduct = (product: any) => {
    setSelectedOfferProduct(product);
    setOfferProductQuantity(1);
    setAddingFromOfferModal(true);
  };

  // Function to confirm adding a product from an offer
  const confirmAddFromOffer = () => {
    if (selectedOfferProduct && offerProductQuantity > 0) {
      addProductFromOffer(selectedOfferProduct, offerProductQuantity);
      setAddingFromOfferModal(false);
      setSelectedOfferProduct(null);
      setOfferProductQuantity(1);
    }
  };

  // Billing System Functions
  const addToSalesCart = (product: any, quantity: number = 1) => {
    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    if (quantity > product.stock) {
      toast.error(`Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    const existingItem = salesCart.find(item => item.productId === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        toast.error(`Solo hay ${product.stock} unidades disponibles`);
        return;
      }
      
      setSalesCart(prev => prev.map(item => 
        item.productId === product.id 
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.unitPrice * (1 - item.discount / 100)
            }
          : item
      ));
    } else {
      const discount = product.discount || 0;
      const unitPrice = product.price;
      const subtotal = quantity * unitPrice * (1 - discount / 100);
      
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice,
        discount,
        subtotal
      };
      
      setSalesCart(prev => [...prev, newItem]);
    }
    
    toast.success(`${product.name} agregado al carrito`);
  };

  const removeFromSalesCart = (productId: number) => {
    setSalesCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    console.log(`Updating cart item ${productId} to quantity ${newQuantity}`);
    
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity <= 0) {
      removeFromSalesCart(productId);
      return;
    }

    if (newQuantity > product.stock) {
      toast.error(`Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    setSalesCart(prev => {
      const updated = prev.map(item => 
        item.productId === productId 
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.unitPrice * (1 - item.discount / 100)
            }
          : item
      );
      console.log('Updated cart:', updated);
      return updated;
    });
  };

  const calculateSaleTotal = () => {
    const subtotal = salesCart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = salesCart.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.discount / 100), 0);
    const total = subtotal - totalDiscount;
    
    return { subtotal, totalDiscount, total };
  };

  const completeSale = () => {
    if (salesCart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    if (!loggedInUser || loggedInUser.role !== "tendero") {
      toast.error("Solo los tenderos pueden realizar ventas");
      return;
    }

    // Validate stock availability
    for (const item of salesCart) {
      const product = products.find(p => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        toast.error(`Stock insuficiente para ${item.productName}`);
        return;
      }
    }

    const { subtotal, totalDiscount, total } = calculateSaleTotal();

    const newSale: Sale = {
      id: crypto.randomUUID(),
      tenderoId: loggedInUser.id,
      items: [...salesCart],
      subtotal,
      totalDiscount,
      total,
      createdAt: new Date().toISOString(),
      customerName: customerName || undefined,
      notes: saleNotes || undefined,
    };

    // Update product stock
    const updatedProducts = products.map(product => {
      const cartItem = salesCart.find(item => item.productId === product.id);
      if (cartItem) {
        return {
          ...product,
          stock: product.stock - cartItem.quantity
        };
      }
      return product;
    });

    // Update state
    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    setProducts(updatedProducts);

    const savedState = updateState((s) => ({
      ...s,
      products: updatedProducts,
      sales: updatedSales,
    }));
    setAppState(savedState);

    // Force component re-render by updating products state again
    setStockUpdateTrigger(prev => prev + 1);

    // Show receipt
    setCurrentSaleReceipt(newSale);
    setShowSaleReceipt(true);

    // Clear cart
    setSalesCart([]);
    setCustomerName("");
    setSaleNotes("");

    toast.success(`✅ Venta completada por $${total.toFixed(2)}`);
  };

  const registerPurchaseFromOffer = (offerId: string, supplierName: string, supplierId: string, items: SaleItem[], total: number) => {
    if (!loggedInUser || loggedInUser.role !== "tendero") {
      toast.error("Solo los tenderos pueden registrar compras");
      return;
    }

    const newPurchase: Purchase = {
      id: crypto.randomUUID(),
      tenderoId: loggedInUser.id,
      supplierId,
      supplierName,
      offerId,
      items,
      total,
      createdAt: new Date().toISOString(),
    };

    const updatedPurchases = [...purchases, newPurchase];
    setPurchases(updatedPurchases);

    const savedState = updateState((s) => ({
      ...s,
      purchases: updatedPurchases,
    }));
    setAppState(savedState);

    toast.success(`✅ Compra registrada por $${total.toFixed(2)}`);
  };

  const getFilteredSales = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      
      switch (historyFilter) {
        case "today":
          return saleDate >= today;
        case "week":
          return saleDate >= weekAgo;
        case "month":
          return saleDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const markMessagesAsRead = (conversationId: string) => {
    if (!appState?.currentUserId) return;

    setConversations((prev) => {
      const next = prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            messages: c.messages.map((m: any) =>
              m.receiverId === appState.currentUserId && !m.read
                ? { ...m, read: true }
                : m
            ),
          };
        }
        return c;
      });
      const saved = updateState((s) => ({ ...s, chats: next }));
      setAppState(saved);
      return next;
    });
  };

  const getAvailableSuppliers = () => {
    return appState?.users.filter((u) => u.role === "proveedor") || [];
  };

  const getAvailableClients = () => {
    return appState?.users.filter((u) => u.role === "tendero") || [];
  };

  // Login/Register screen
  if (!loggedInUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="bg-primary rounded-full p-3">
                <Store className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              StockSync
            </h1>
            <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para continuar
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Usuario</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={
                      loginUserType === "tendero" ? "default" : "outline"
                    }
                    onClick={() => setLoginUserType("tendero")}
                    className="h-auto py-3 flex-col gap-1"
                  >
                    <Store className="h-5 w-5" />
                    <span className="text-xs">Tendero</span>
                  </Button>
                  <Button
                    type="button"
                    variant={
                      loginUserType === "proveedor" ? "default" : "outline"
                    }
                    onClick={() => setLoginUserType("proveedor")}
                    className="h-auto py-3 flex-col gap-1"
                  >
                    <Users className="h-5 w-5" />
                    <span className="text-xs">Proveedor</span>
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11">
                Iniciar Sesión
              </Button>
              <div className="text-center text-sm text-muted-foreground mt-4">
                <p>¿No tienes cuenta? Contacta al administrador</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render content for proveedor
  if (loggedInUser?.role === "proveedor") {
    return (
      <>
        <div className="min-h-screen bg-background">
          <header className="bg-card border-b border-border p-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-card-foreground">
                  StockSync Proveedor
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChatOpen(true)}
                    title="Mensajes"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  {getUnreadCount() > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {getUnreadCount()}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {validationMessage && (
            <div className={`max-w-4xl mx-auto p-4`}>
              <div
                className={`p-3 rounded-lg flex items-center gap-2 ${
                  validationType === "success"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {validationType === "success" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {validationMessage}
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto p-4">
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dashboard">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="products">
                  <Package className="h-4 w-4 mr-2" />
                  Productos
                </TabsTrigger>
                <TabsTrigger value="announcements">
                  <Megaphone className="h-4 w-4 mr-2" />
                  Anuncios
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Mi Perfil de Proveedor</CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => setEditingSupplierProfile(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                        <Store className="h-5 w-5 text-primary" />
                        <span className="font-bold text-lg text-primary">
                          {supplierProfile.businessName || supplierProfile.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {supplierProfile.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{supplierProfile.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{supplierProfile.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{supplierProfile.address}</span>
                      </div>
                      {supplierProfile.description && (
                        <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                          <p className="text-muted-foreground">Descripción:</p>
                          <span className="font-medium">
                            {supplierProfile.description}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Productos Activos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {supplierProducts.length}
                    </div>
                    <p className="text-xs text-muted-foreground">En catálogo</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Mis Productos</h2>
                  <Button onClick={() => setAddingSupplierProduct(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>
                </div>

                <div className="grid gap-4">
                  {supplierProducts.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {product.name}
                            </h3>
                            <p className="text-muted-foreground">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              {product.discount > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground line-through">
                                    ${product.price}
                                  </span>
                                  <span className="font-bold text-lg text-primary">
                                    $
                                    {(
                                      product.price *
                                      (1 - product.discount / 100)
                                    ).toFixed(2)}
                                  </span>
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    -{product.discount}%
                                  </Badge>
                                </div>
                              ) : (
                                <span className="font-bold text-lg text-primary">
                                  ${product.price}
                                </span>
                              )}
                              <Badge variant="secondary">
                                {product.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditSupplierProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSupplierProducts((prev) => {
                                  const next = prev.filter(
                                    (p) => p.id !== product.id
                                  );
                                  // Guardar cambios en localStorage
                                  const saved = updateState((s) => ({
                                    ...s,
                                    supplierProducts: next,
                                  }));
                                  setAppState(saved);
                                  return next;
                                });
                                showValidation(
                                  "Producto eliminado correctamente",
                                  "success"
                                );
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="announcements" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Mis Anuncios</h2>
                  <Button onClick={() => setAddingAnnouncement(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Anuncio
                  </Button>
                </div>

                <div className="grid gap-4">
                  {supplierAnnouncements.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium mb-2">
                          No tienes anuncios publicados
                        </p>
                        <p className="text-muted-foreground mb-4">
                          Crea un anuncio para que los clientes vean tus
                          productos
                        </p>
                        <Button onClick={() => setAddingAnnouncement(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Primer Anuncio
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    supplierAnnouncements.map((announcement) => (
                      <Card key={announcement.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-lg">
                            Anuncio - {announcement.products.length} productos
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteAnnouncement(announcement.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {announcement.products.map((product: any) => (
                              <div
                                key={product.id}
                                className="p-3 bg-muted rounded-lg"
                              >
                                <img
                                  src={product.image || "/placeholder.svg"}
                                  alt={product.name}
                                  className="w-full h-20 rounded object-cover mb-2"
                                />
                                <p className="text-sm font-medium truncate">
                                  {product.name}
                                </p>
                                {product.discount > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground line-through">
                                      ${product.price}
                                    </span>
                                    <span className="text-sm font-bold text-primary">
                                      $
                                      {(
                                        product.price *
                                        (1 - product.discount / 100)
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-sm font-bold text-primary">
                                    ${product.price}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Dialog
            open={editingSupplierProfile}
            onOpenChange={setEditingSupplierProfile}
          >
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Editar Perfil de Proveedor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="supplierBusinessName">
                    Nombre del Negocio/Empresa
                  </Label>
                  <Input
                    id="supplierBusinessName"
                    placeholder="Ej: Distribuidora López S.A."
                    value={supplierProfile.businessName}
                    onChange={(e) =>
                      setSupplierProfile((prev) => ({
                        ...prev,
                        businessName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="supplierName">Nombre del Contacto</Label>
                  <Input
                    id="supplierName"
                    placeholder="Ej: Juan López"
                    value={supplierProfile.name}
                    onChange={(e) =>
                      setSupplierProfile((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="supplierPhone">Teléfono de Contacto</Label>
                  <Input
                    id="supplierPhone"
                    value={supplierProfile.phone}
                    onChange={(e) =>
                      setSupplierProfile((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="supplierEmail">Correo Electrónico</Label>
                  <Input
                    id="supplierEmail"
                    type="email"
                    value={supplierProfile.email}
                    onChange={(e) =>
                      setSupplierProfile((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="supplierAddress">Dirección</Label>
                  <Input
                    id="supplierAddress"
                    value={supplierProfile.address}
                    onChange={(e) =>
                      setSupplierProfile((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="supplierDescription">
                    Descripción del Negocio
                  </Label>
                  <Textarea
                    id="supplierDescription"
                    placeholder="Describe tu negocio y productos..."
                    value={supplierProfile.description}
                    onChange={(e) =>
                      setSupplierProfile((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingSupplierProfile(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={saveSupplierProfile} className="flex-1">
                    Guardar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={!!editingSupplierProduct}
            onOpenChange={() => setEditingSupplierProduct(null)}
          >
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Editar Producto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productName">Nombre del Producto</Label>
                  <Input
                    id="productName"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="productPrice">Precio</Label>
                  <Input
                    id="productPrice"
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        price: Number.parseFloat(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="productCategory">Categoría</Label>
                  <Select
                    value={editForm.category}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({
                        ...prev,
                        category: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="productDiscount">Descuento (%)</Label>
                  <Input
                    id="productDiscount"
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.discount}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        discount: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Imagen del Producto</Label>
                  {editForm.image && (
                    <div className="mb-3 relative">
                      <img
                        src={editForm.image}
                        alt={editForm.name || "Producto"}
                        className="w-full h-32 rounded-lg object-cover border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            image: "",
                          }))
                        }
                        className="absolute top-2 right-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        document
                          .getElementById("editProductImageInput")
                          ?.click()
                      }
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Cargar Imagen
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Camera className="h-4 w-4 mr-2" />
                      Capturar
                    </Button>
                  </div>
                  <input
                    id="editProductImageInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setEditForm((prev) => ({
                            ...prev,
                            image: event.target?.result as string,
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingSupplierProduct(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={saveSupplierProductEdit} className="flex-1">
                    Guardar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={addingSupplierProduct}
            onOpenChange={setAddingSupplierProduct}
          >
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newProductName">Nombre del Producto *</Label>
                  <Input
                    id="newProductName"
                    placeholder="Ej: Coca Cola 2L"
                    value={newSupplierProduct.name}
                    onChange={(e) =>
                      setNewSupplierProduct((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="newProductBarcode">Código de Barras</Label>
                  <Input
                    id="newProductBarcode"
                    placeholder="Ej: 123456789012"
                    value={newSupplierProduct.barcode}
                    onChange={(e) =>
                      setNewSupplierProduct((prev) => ({
                        ...prev,
                        barcode: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="newProductPrice">Precio *</Label>
                  <Input
                    id="newProductPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newSupplierProduct.price || ""}
                    onChange={(e) =>
                      setNewSupplierProduct((prev) => ({
                        ...prev,
                        price: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="newProductCategory">Categoría *</Label>
                  <Select
                    value={newSupplierProduct.category}
                    onValueChange={(value) =>
                      setNewSupplierProduct((prev) => ({
                        ...prev,
                        category: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="newProductDescription">Descripción</Label>
                  <Textarea
                    id="newProductDescription"
                    placeholder="Descripción del producto..."
                    value={newSupplierProduct.description}
                    onChange={(e) =>
                      setNewSupplierProduct((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="newProductStock">Stock Disponible</Label>
                  <Input
                    id="newProductStock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newSupplierProduct.stock || ""}
                    onChange={(e) =>
                      setNewSupplierProduct((prev) => ({
                        ...prev,
                        stock: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="newProductMinStock">Stock Mínimo</Label>
                  <Input
                    id="newProductMinStock"
                    type="number"
                    min="0"
                    placeholder="5"
                    value={newSupplierProduct.minStock || ""}
                    onChange={(e) =>
                      setNewSupplierProduct((prev) => ({
                        ...prev,
                        minStock: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="newProductDiscount">Descuento (%)</Label>
                  <Input
                    id="newProductDiscount"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={newSupplierProduct.discount || ""}
                    onChange={(e) =>
                      setNewSupplierProduct((prev) => ({
                        ...prev,
                        discount: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Imagen del Producto</Label>
                  {newSupplierProduct.image && (
                    <div className="mb-3 relative">
                      <img
                        src={newSupplierProduct.image}
                        alt={newSupplierProduct.name || "Producto"}
                        className="w-full h-32 rounded-lg object-cover border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setNewSupplierProduct((prev) => ({
                            ...prev,
                            image: "",
                          }))
                        }
                        className="absolute top-2 right-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        document
                          .getElementById("supplierProductImageInput")
                          ?.click()
                      }
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Cargar Imagen
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Camera className="h-4 w-4 mr-2" />
                      Capturar
                    </Button>
                  </div>
                  <input
                    id="supplierProductImageInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setNewSupplierProduct((prev) => ({
                            ...prev,
                            image: event.target?.result as string,
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddingSupplierProduct(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={addSupplierProduct} className="flex-1">
                    Agregar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={addingAnnouncement}
            onOpenChange={setAddingAnnouncement}
          >
            <DialogContent className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Anuncio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Selecciona los productos que deseas publicar en este anuncio
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {supplierProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedProductsForAnnouncement.includes(product.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => {
                        setSelectedProductsForAnnouncement((prev) =>
                          prev.includes(product.id)
                            ? prev.filter((id) => id !== product.id)
                            : [...prev, product.id]
                        );
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedProductsForAnnouncement.includes(product.id)
                              ? "bg-primary border-primary"
                              : "border-border"
                          }`}
                        >
                          {selectedProductsForAnnouncement.includes(
                            product.id
                          ) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="font-medium text-sm">
                          {product.name}
                        </span>
                        {product.category && (
                          <Badge className="ml-auto" variant="secondary">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-20 rounded object-cover mb-2"
                      />
                      {product.discount > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground line-through">
                            ${product.price}
                          </span>
                          <span className="text-sm font-bold text-primary">
                            $
                            {(
                              product.price *
                              (1 - product.discount / 100)
                            ).toFixed(2)}
                          </span>
                          <Badge variant="destructive" className="text-xs ml-1">
                            -{product.discount}%
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-primary">
                          ${product.price}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddingAnnouncement(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={createAnnouncement} className="flex-1">
                    Publicar Anuncio ({selectedProductsForAnnouncement.length}{" "}
                    productos)
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Chat Dialog - Shared between roles */}
        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="max-w-md mx-auto h-[600px] flex flex-col p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Mensajes
              </DialogTitle>
            </DialogHeader>

            {!selectedChatUser ? (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      {loggedInUser?.role === "proveedor"
                        ? "Contactar Clientes"
                        : "Contactar Proveedores"}
                    </h3>
                    <div className="space-y-2">
                      {(loggedInUser?.role === "proveedor"
                        ? getAvailableClients()
                        : getAvailableSuppliers()
                      ).map((user) => {
                        const conversation = conversations.find(
                          (c) =>
                            (c.participant1Id === appState?.currentUserId &&
                              c.participant2Id === user.id) ||
                            (c.participant1Id === user.id &&
                              c.participant2Id === appState?.currentUserId)
                        );
                        const unreadCount =
                          conversation?.messages.filter(
                            (m: any) =>
                              m.receiverId === appState?.currentUserId &&
                              !m.read
                          ).length || 0;
                        const lastMessage =
                          conversation?.messages[
                            conversation.messages.length - 1
                          ];

                        return (
                          <Card
                            key={user.id}
                            className="cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => {
                              setSelectedChatUser(user);
                              if (conversation) {
                                markMessagesAsRead(conversation.id);
                              }
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-primary rounded-full p-2 flex-shrink-0">
                                  {loggedInUser?.role === "proveedor" ? (
                                    <Store className="h-5 w-5 text-primary-foreground" />
                                  ) : (
                                    <Users className="h-5 w-5 text-primary-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium truncate">
                                      {user.name}
                                    </h4>
                                    {unreadCount > 0 && (
                                      <Badge
                                        variant="destructive"
                                        className="ml-2"
                                      >
                                        {unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {user.storeName || user.email}
                                  </p>
                                  {lastMessage && (
                                    <p className="text-xs text-muted-foreground truncate mt-1">
                                      {lastMessage.senderId ===
                                      appState?.currentUserId
                                        ? "Tú: "
                                        : ""}
                                      {lastMessage.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {conversations.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">
                        Conversaciones Recientes
                      </h3>
                      <div className="space-y-2">
                        {conversations
                          .filter((c) => c.messages.length > 0)
                          .sort(
                            (a, b) =>
                              new Date(b.lastMessageAt).getTime() -
                              new Date(a.lastMessageAt).getTime()
                          )
                          .slice(0, 5)
                          .map((conversation) => {
                            const otherUserId =
                              conversation.participant1Id ===
                              appState?.currentUserId
                                ? conversation.participant2Id
                                : conversation.participant1Id;
                            const otherUser = appState?.users.find(
                              (u) => u.id === otherUserId
                            );
                            if (!otherUser) return null;

                            const unreadCount = conversation.messages.filter(
                              (m: any) =>
                                m.receiverId === appState?.currentUserId &&
                                !m.read
                            ).length;
                            const lastMessage =
                              conversation.messages[
                                conversation.messages.length - 1
                              ];

                            return (
                              <Card
                                key={conversation.id}
                                className="cursor-pointer hover:bg-muted transition-colors"
                                onClick={() => {
                                  setSelectedChatUser(otherUser);
                                  markMessagesAsRead(conversation.id);
                                }}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-muted rounded-full p-2 flex-shrink-0">
                                      <MessageCircle className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium truncate">
                                          {otherUser.name}
                                        </h4>
                                        {unreadCount > 0 && (
                                          <Badge
                                            variant="destructive"
                                            className="ml-2"
                                          >
                                            {unreadCount}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {lastMessage.senderId ===
                                        appState?.currentUserId
                                          ? "Tú: "
                                          : ""}
                                        {lastMessage.message}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(
                                          lastMessage.timestamp
                                        ).toLocaleString("es-CO", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          day: "2-digit",
                                          month: "short",
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 border-b flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedChatUser(null)}
                  >
                    ← Atrás
                  </Button>
                  <div className="flex-1">
                    <h4 className="font-medium">{selectedChatUser.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedChatUser.storeName || selectedChatUser.email}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                  {(() => {
                    const conversation = getCurrentConversation();
                    if (!conversation || conversation.messages.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No hay mensajes aún. ¡Inicia la conversación!
                          </p>
                        </div>
                      );
                    }

                    return conversation.messages.map((message: any) => {
                      const isOwn =
                        message.senderId === appState?.currentUserId;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwn ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg p-3 ${
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-background border"
                            }`}
                          >
                            <p className="text-sm break-words">
                              {message.message}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {new Date(message.timestamp).toLocaleTimeString(
                                "es-CO",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="p-4 border-t bg-background">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!chatMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Tendero view
  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border p-4 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <div className="bg-primary rounded-lg p-2">
                <Store className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-card-foreground">
                  StockSync
                </h1>
                {appState?.currentUserId && (
                  <p className="text-xs text-muted-foreground">
                    {appState.users.find((u) => u.id === appState.currentUserId)
                      ?.storeName ||
                      appState.users.find(
                        (u) => u.id === appState.currentUserId
                      )?.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lowStockProducts.length > 0 && (
                <Badge
                  variant="destructive"
                  className="bg-red-500 text-white animate-pulse"
                >
                  {lowStockProducts.length}{" "}
                  {lowStockProducts.length === 1 ? "Alerta" : "Alertas"}
                </Badge>
              )}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChatOpen(true)}
                  title="Mensajes"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                {getUnreadCount() > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {getUnreadCount()}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {validationMessage && (
          <div className="max-w-md mx-auto p-4">
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                validationType === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {validationType === "success" ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              {validationMessage}
            </div>
          </div>
        )}

        <div className="max-w-md mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 m-4">
              <TabsTrigger value="scan" className="flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                Escanear
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Inventario
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alertas
              </TabsTrigger>
              <TabsTrigger
                value="suppliers"
                className="flex items-center gap-2"
              >
                <Megaphone className="h-4 w-4" />
                Ofertas
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Facturación
              </TabsTrigger>
            </TabsList>

            {/* Scanning Tab */}
            <TabsContent value="scan" className="p-4 space-y-4">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Registrar Mercancía</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="relative bg-black rounded-lg overflow-hidden"
                    style={{ minHeight: "500px", height: "500px" }}
                  >
                    {/* Video siempre renderizado cuando está escaneando */}
                    {isScanning && (
                      <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        autoPlay
                        playsInline
                        muted
                        crossOrigin="anonymous"
                      />
                    )}

                    {/* Overlay de UI */}
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border-4 border-green-500 w-64 h-64 rounded-lg animate-pulse"></div>
                      </div>
                    )}

                    {/* Mensaje cuando no está escaneando */}
                    {!isScanning && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-4 text-white">
                          <Camera className="h-16 w-16 mx-auto text-gray-400" />
                          <p className="text-lg">
                            Presiona "Escanear" para iniciar
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Instrucciones durante el escaneo */}
                    {isScanning && !scanResult && stream && (
                      <div className="absolute bottom-4 left-0 right-0 text-center space-y-2 z-10 bg-black/50 p-4 rounded-t-lg">
                        <p className="text-lg font-medium text-white">
                          Apunte la cámara al código de barras
                        </p>
                        <div className="w-full h-1 bg-white/20 rounded">
                          <div className="h-full bg-primary rounded animate-pulse w-full"></div>
                        </div>
                      </div>
                    )}

                    {/* Resultado del escaneo */}
                    {scanResult && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                        <div className="text-center space-y-2">
                          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                          <p className="text-lg font-bold text-green-600">
                            {detectedProduct} detectado
                          </p>
                          <p className="text-sm text-white">
                            Producto escaneado correctamente
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={startScanning}
                    disabled={isScanning}
                    className="w-full h-14 text-lg"
                    size="lg"
                  >
                    {isScanning ? (
                      <>
                        <Camera className="h-5 w-5 mr-2 animate-pulse" />
                        Escaneando...
                      </>
                    ) : (
                      <>
                        <Camera className="h-5 w-5 mr-2" />
                        Iniciar Escaneo
                      </>
                    )}
                  </Button>

                  {isScanning && (
                    <Button
                      onClick={stopScanning}
                      variant="outline"
                      className="w-full h-14 text-lg"
                      size="lg"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Detener Escaneo
                    </Button>
                  )}

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      ¿No tienes código de barras?
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setAddingProduct(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Producto Manualmente
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Dialog open={confirmScanOpen} onOpenChange={setConfirmScanOpen}>
                <DialogContent className="max-w-sm mx-auto">
                  <DialogHeader>
                    <DialogTitle>Confirmar producto escaneado</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <strong>Código de barras:</strong> {scanResult}
                    </div>
                    {!capturedPhoto && videoRef.current && stream && (
                      <Button
                        variant="outline"
                        onClick={takePhotoFromVideo}
                        className="w-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Tomar foto del producto (opcional)
                      </Button>
                    )}
                    {capturedPhoto && (
                      <div className="relative">
                        <img
                          src={capturedPhoto}
                          alt="captured"
                          className="w-full rounded"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setCapturedPhoto(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <canvas ref={captureCanvasRef} className="hidden" />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setConfirmScanOpen(false);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={async () => {
                          if (!scanResult) {
                            setConfirmScanOpen(false);
                            return;
                          }

                          try {
                            // Procesar el código de barras
                            await handleBarcodeDetected(scanResult);

                            // Si se capturó foto, actualizar imagen del producto
                            if (capturedPhoto) {
                              setProducts((prev) => {
                                const next = [...prev];
                                const idx = next.findIndex(
                                  (p) => p.barcode === scanResult
                                );
                                if (idx >= 0) {
                                  next[idx] = {
                                    ...next[idx],
                                    image: capturedPhoto,
                                  };
                                  const saved = updateState((s) => ({
                                    ...s,
                                    products: next,
                                  }));
                                  setAppState(saved);
                                }
                                return next;
                              });
                            }
                          } catch (error) {
                            console.error("Error processing barcode:", error);
                            toast.error(
                              "Error al procesar el código de barras"
                            );
                          }

                          // Limpiar estado
                          setDetectedProduct(null);
                          setScanResult(null);
                          setCapturedPhoto(null);
                          setConfirmScanOpen(false);
                          // Permitir nuevos escaneos (liberar lock)
                          console.log(
                            "🔓 Limpiando handledBarcodeRef al confirmar scan"
                          );
                          handledBarcodeRef.current = null;
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Confirmar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Modal para producto existente */}
              <Dialog
                open={existingProductModal}
                onOpenChange={setExistingProductModal}
              >
                <DialogContent className="max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Producto encontrado
                    </DialogTitle>
                  </DialogHeader>
                  {existingProductData && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          ✅ Este producto ya existe en tu inventario
                        </p>
                      </div>

                      <div className="space-y-2">
                        <img
                          src={existingProductData.image || "/placeholder.svg"}
                          alt={existingProductData.name}
                          className="w-full h-40 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-semibold text-lg">
                            {existingProductData.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Código: {existingProductData.barcode}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            Stock actual
                          </p>
                          <p className="text-2xl font-bold">
                            {existingProductData.stock}
                          </p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            Precio
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            ${existingProductData.price}
                          </p>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <label className="text-sm font-medium text-blue-900">
                          ¿Cuántas unidades deseas agregar?
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={existingProductQty}
                          onChange={(e) =>
                            setExistingProductQty(e.target.value)
                          }
                          className="mt-2"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            console.log(
                              "🔓 Limpiando handledBarcodeRef al cancelar existingProductModal"
                            );
                            setExistingProductModal(false);
                            setExistingProductData(null);
                            handledBarcodeRef.current = null;
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => {
                            const qty = Number.parseInt(existingProductQty) || 1;
                            if (qty < 0) {
                              // Registrar venta automática a 'anonimo'
                              const sale = {
                                id: crypto.randomUUID(),
                                tenderoId: loggedInUser?.id || 'anonimo',
                                items: [{
                                  productId: existingProductData.id,
                                  productName: existingProductData.name,
                                  quantity: Math.abs(qty),
                                  unitPrice: existingProductData.price,
                                  discount: existingProductData.discount || 0,
                                  subtotal: Math.abs(qty) * existingProductData.price * (1 - (existingProductData.discount || 0) / 100)
                                }],
                                subtotal: Math.abs(qty) * existingProductData.price,
                                totalDiscount: 0,
                                total: Math.abs(qty) * existingProductData.price,
                                createdAt: new Date().toISOString(),
                                customerName: 'anonimo',
                                notes: 'Venta automática por escaneo negativo',
                              };
                              setSales((prev) => [...prev, sale]);
                              // Descontar stock
                              setProducts((prev) => {
                                const next = prev.map((p) =>
                                  p.id === existingProductData.id
                                    ? {
                                        ...p,
                                        stock: p.stock + qty, // qty es negativo
                                      }
                                    : p
                                );
                                const saved = updateState((s) => ({
                                  ...s,
                                  products: next,
                                  sales: [...(s.sales || []), sale],
                                }));
                                setAppState(saved);
                                return next;
                              });
                              toast.success(`Venta registrada: ${existingProductData.name} x ${Math.abs(qty)} a anonimo`);
                            } else {
                              // Flujo normal: agregar stock
                              setProducts((prev) => {
                                const next = prev.map((p) =>
                                  p.id === existingProductData.id
                                    ? {
                                        ...p,
                                        stock: p.stock + qty,
                                      }
                                    : p
                                );
                                const saved = updateState((s) => ({
                                  ...s,
                                  products: next,
                                }));
                                setAppState(saved);
                                return next;
                              });
                              toast.success(
                                `${existingProductData.name}: +${qty} unidad${qty > 1 ? "es" : ""}`
                              );
                            }
                            // Limpiar modal y refs
                            setExistingProductModal(false);
                            setExistingProductData(null);
                            setExistingProductQty("1");
                            handledBarcodeRef.current = null;
                          }}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Confirmar y agregar
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Mi Inventario</h2>
                  <p className="text-sm text-muted-foreground">
                    {products.length}{" "}
                    {products.length === 1 ? "producto" : "productos"} en total
                  </p>
                </div>
                <Button
                  onClick={() => setAddingProduct(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>

              {filteredProducts.length === 0 && searchTerm && (
                <Card className="p-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-lg font-medium mb-1">
                    No se encontraron productos
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Intenta con otro término de búsqueda
                  </p>
                </Card>
              )}

              {filteredProducts.length === 0 && !searchTerm && (
                <Card className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-lg font-medium mb-1">
                    No hay productos aún
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comienza escaneando productos o agrégalos manualmente
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={() => setActiveTab("scan")}
                      variant="outline"
                    >
                      <ScanLine className="h-4 w-4 mr-2" />
                      Escanear
                    </Button>
                    <Button onClick={() => setAddingProduct(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </Card>
              )}

              <div className="space-y-3">
                {filteredProducts.map((product) => {
                  const status = getStockStatus(
                    product.stock,
                    product.minStock
                  );
                  return (
                    <Card
                      key={product.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover border"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">
                              {product.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-1">
                              {product.barcode}
                            </p>
                            <div className="flex items-center gap-2" key={`stock-${product.id}-${product.stock}`}>
                              <div
                                className={`w-2 h-2 rounded-full ${status.color}`}
                              ></div>
                              <span className="text-xl font-bold">
                                {product.stock}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                unidades
                              </span>
                              {product.price > 0 && (
                                <span className="ml-auto text-sm font-medium text-primary">
                                  ${product.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditProduct(product)}
                              title="Editar producto"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteProduct(product.id)}
                              title="Eliminar producto"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProduct(product)}
                              title="Ver detalles"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="p-4 space-y-4">
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-1">Alertas de Stock</h2>
                <p className="text-sm text-muted-foreground">
                  Productos que necesitan ser reabastecidos
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-600">
                      {lowStockProducts.length}{" "}
                      {lowStockProducts.length === 1 ? "Producto" : "Productos"}{" "}
                      con Stock Bajo
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lowStockProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-3" />
                      <p className="text-lg font-medium mb-1">
                        ¡Todo en orden!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        No hay productos con stock bajo en este momento
                      </p>
                    </div>
                  ) : (
                    lowStockProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="border-amber-200 bg-amber-50/50"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4 mb-3">
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-16 h-16 rounded-lg object-cover border"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-base">
                                {product.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mb-2">
                                {product.barcode}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="destructive"
                                  className="text-xs font-medium"
                                >
                                  {product.stock}{" "}
                                  {product.stock === 1 ? "unidad" : "unidades"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Stock mínimo: {product.minStock}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStock(product.id, 1)}
                              title="Agregar 1 unidad"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="mt-4 pt-3 border-t">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <Megaphone className="h-4 w-4" />
                              Ofertas de Proveedores:
                            </h4>
                            {(() => {
                              // Algoritmo inteligente de sugerencias
                              // 1. Buscar por nombre exacto o similar
                              const productNameLower =
                                product.name.toLowerCase();
                              const productWords = productNameLower.split(" ");

                              const byExactName = supplierProducts.filter(
                                (sp) =>
                                  sp.name.toLowerCase() === productNameLower
                              );

                              const bySimilarName = supplierProducts.filter(
                                (sp) => {
                                  const spNameLower = sp.name.toLowerCase();
                                  return productWords.some(
                                    (word: string) =>
                                      word.length > 3 &&
                                      spNameLower.includes(word)
                                  );
                                }
                              );

                              // 2. Buscar por categoría igual
                              const byCategory = product.category
                                ? supplierProducts.filter(
                                    (sp) =>
                                      sp.category &&
                                      sp.category.toLowerCase() ===
                                        product.category.toLowerCase()
                                  )
                                : [];

                              // 3. Otras alternativas (diferentes categorías)
                              const others = supplierProducts.filter(
                                (sp) =>
                                  sp.category &&
                                  sp.category !== product.category
                              );

                              // Combinar con prioridad y eliminar duplicados
                              const uniqueMap = new Map<number, any>();

                              // Prioridad 1: Nombre exacto
                              byExactName.forEach((sp) =>
                                uniqueMap.set(sp.id, { ...sp, priority: 1 })
                              );

                              // Prioridad 2: Nombre similar
                              bySimilarName.forEach((sp) => {
                                if (!uniqueMap.has(sp.id)) {
                                  uniqueMap.set(sp.id, { ...sp, priority: 2 });
                                }
                              });

                              // Prioridad 3: Misma categoría
                              byCategory.forEach((sp) => {
                                if (!uniqueMap.has(sp.id)) {
                                  uniqueMap.set(sp.id, { ...sp, priority: 3 });
                                }
                              });

                              // Prioridad 4: Otras opciones
                              others.slice(0, 2).forEach((sp) => {
                                if (!uniqueMap.has(sp.id)) {
                                  uniqueMap.set(sp.id, { ...sp, priority: 4 });
                                }
                              });

                              const suggestions = Array.from(uniqueMap.values())
                                .sort((a, b) => a.priority - b.priority)
                                .slice(0, 5);

                              if (suggestions.length === 0) {
                                return (
                                  <div className="bg-background p-4 rounded-lg border">
                                    <p className="text-sm text-muted-foreground mb-2">
                                      No hay ofertas disponibles para este
                                      producto.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      💬 Puedes contactar directamente a
                                      proveedores mediante el chat
                                    </p>
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-2">
                                  {suggestions.map((sp) => {
                                    const matchType =
                                      sp.priority === 1
                                        ? "Producto idéntico"
                                        : sp.priority === 2
                                        ? "Producto similar"
                                        : sp.priority === 3
                                        ? `Categoría: ${sp.category}`
                                        : "Alternativa";

                                    return (
                                      <div
                                        key={sp.id}
                                        className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary transition-colors"
                                      >
                                        <div className="flex items-center gap-3 flex-1">
                                          <img
                                            src={sp.image || "/placeholder.svg"}
                                            alt={sp.name}
                                            className="w-10 h-10 rounded object-cover"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                              {sp.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                              {sp.category && (
                                                <Badge
                                                  variant="secondary"
                                                  className="text-xs"
                                                >
                                                  {sp.category}
                                                </Badge>
                                              )}
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {matchType}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right ml-2">
                                          {sp.discount > 0 ? (
                                            <div>
                                              <p className="text-xs text-muted-foreground line-through">
                                                ${sp.price}
                                              </p>
                                              <p className="font-bold text-primary">
                                                $
                                                {(
                                                  sp.price *
                                                  (1 - sp.discount / 100)
                                                ).toFixed(2)}
                                              </p>
                                              <Badge
                                                variant="destructive"
                                                className="text-xs"
                                              >
                                                -{sp.discount}%
                                              </Badge>
                                            </div>
                                          ) : (
                                            <p className="font-bold text-primary text-lg">
                                              ${sp.price}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <div className="text-center pt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setChatOpen(true);
                                      }}
                                    >
                                      <MessageCircle className="h-4 w-4 mr-2" />
                                      Contactar Proveedores
                                    </Button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suppliers" className="p-4 space-y-4">
              <div className="bg-gradient-to-r from-purple-500/10 via-primary/10 to-blue-500/10 p-6 rounded-lg border-2 border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary rounded-full p-2">
                    <Megaphone className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold">Ofertas Especiales</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Descubre las mejores ofertas de nuestros proveedores
                  verificados
                </p>
              </div>

              {supplierAnnouncements.length === 0 ? (
                <Card className="p-8 text-center">
                  <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
                  <p className="text-lg font-medium mb-1">
                    No hay ofertas disponibles
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Los proveedores aún no han publicado ofertas
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {supplierAnnouncements.map((announcement) => (
                    <Card key={announcement.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">
                              Oferta - {announcement.products.length}{" "}
                              {announcement.products.length === 1
                                ? "producto"
                                : "productos"}
                            </CardTitle>
                            {announcement.supplier && (
                              <div className="flex items-center gap-2 mt-1">
                                <Store className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">
                                  {announcement.supplier.businessName || announcement.supplier.name}
                                </span>
                                {announcement.supplier.phone && (
                                  <span className="text-xs text-muted-foreground">
                                    • {announcement.supplier.phone}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {new Date(
                              announcement.createdAt
                            ).toLocaleDateString("es-CO")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {announcement.products.map((product: any) => (
                            <div
                              key={product.id}
                              className="border rounded-lg p-3 hover:border-primary transition-colors"
                            >
                              <img
                                src={product.image || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-24 rounded object-cover mb-2"
                              />
                              <p className="text-sm font-medium truncate mb-1">
                                {product.name}
                              </p>
                              {product.category && (
                                <Badge
                                  variant="outline"
                                  className="text-xs mb-2"
                                >
                                  {product.category}
                                </Badge>
                              )}
                              {product.discount > 0 ? (
                                <div className="flex items-center gap-1 mb-2">
                                  <span className="text-xs text-muted-foreground line-through">
                                    ${product.price}
                                  </span>
                                  <span className="text-sm font-bold text-primary">
                                    $
                                    {(
                                      product.price *
                                      (1 - product.discount / 100)
                                    ).toFixed(2)}
                                  </span>
                                  <Badge
                                    variant="destructive"
                                    className="text-xs ml-auto"
                                  >
                                    -{product.discount}%
                                  </Badge>
                                </div>
                              ) : (
                                <p className="text-sm font-bold text-primary mb-2">
                                  ${product.price}
                                </p>
                              )}
                              <Button
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => handleSelectOfferProduct(product)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar a inventario
                              </Button>
                            </div>
                          ))}
                        </div>
                        {announcement.supplier && (
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="text-xs text-muted-foreground">
                              <p>Contacto: {announcement.supplier.email}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Find supplier in users and start chat
                                const supplier = appState?.users.find(u => u.email === announcement.supplier.email);
                                if (supplier) {
                                  setSelectedChatUser(supplier);
                                  setChatOpen(true);
                                }
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Contactar
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="p-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Cart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Nueva Venta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Customer Info */}
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Cliente (opcional)</Label>
                      <Input
                        id="customerName"
                        placeholder="Nombre del cliente"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-2">
                      <Label>Seleccionar Productos</Label>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {products.filter(p => p.stock > 0).map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Stock: {product.stock} | ${product.price}
                                {product.discount && product.discount > 0 && (
                                  <span className="text-green-600 ml-1">
                                    ({product.discount}% desc.)
                                  </span>
                                )}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addToSalesCart(product, 1)}
                              disabled={product.stock === 0}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shopping Cart */}
                    {salesCart.length > 0 && (
                      <div className="space-y-2">
                        <Label>Carrito de Venta</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {salesCart.map((item) => (
                            <div key={`${item.productId}-${item.quantity}`} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.productName}</p>
                                <p className="text-xs text-muted-foreground">
                                  ${item.unitPrice} x {item.quantity} = ${item.subtotal.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQty = parseInt(e.target.value) || 1;
                                    updateCartItemQuantity(item.productId, newQty);
                                  }}
                                  className="w-16 h-8 text-center text-sm mx-1"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeFromSalesCart(item.productId)}
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Sale Total */}
                        <div className="border-t pt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>${calculateSaleTotal().subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Descuentos:</span>
                            <span>-${calculateSaleTotal().totalDiscount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Total:</span>
                            <span>${calculateSaleTotal().total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                          <Label htmlFor="saleNotes">Notas (opcional)</Label>
                          <Textarea
                            id="saleNotes"
                            placeholder="Notas sobre la venta..."
                            value={saleNotes}
                            onChange={(e) => setSaleNotes(e.target.value)}
                          />
                        </div>

                        {/* Complete Sale Button */}
                        <Button
                          className="w-full"
                          onClick={completeSale}
                          disabled={salesCart.length === 0}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completar Venta
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sales History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Historial de Ventas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Filter */}
                    <Select value={historyFilter} onValueChange={setHistoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las ventas</SelectItem>
                        <SelectItem value="today">Hoy</SelectItem>
                        <SelectItem value="week">Esta semana</SelectItem>
                        <SelectItem value="month">Este mes</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Sales List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {getFilteredSales().length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          No hay ventas en este período
                        </p>
                      ) : (
                        getFilteredSales().map((sale) => (
                          <div key={sale.id} className="border rounded p-3 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {sale.customerName || "Cliente anónimo"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(sale.createdAt).toLocaleString("es-CO")}
                                </p>
                              </div>
                              <span className="font-bold text-green-600">
                                ${sale.total.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {sale.items.length} productos
                              {sale.notes && (
                                <span className="ml-2">• {sale.notes}</span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCurrentSaleReceipt(sale);
                                setShowSaleReceipt(true);
                              }}
                            >
                              Ver Comprobante
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={addingProduct} onOpenChange={setAddingProduct}>
          <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {newProduct.barcode && newProduct.barcode !== ""
                  ? "Nuevo Producto (Código Escaneado)"
                  : "Agregar Producto Manualmente"}
              </DialogTitle>
            </DialogHeader>
            {newProduct.barcode && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                <p className="text-sm text-amber-800">
                  ℹ️ <strong>Código de barras no encontrado:</strong>{" "}
                  {newProduct.barcode}
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Completa los datos del producto y guárdalo en el inventario
                </p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-name">Nombre del Producto *</Label>
                <Input
                  id="product-name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  placeholder="Ej: Coca Cola 600ml"
                />
              </div>
              <div>
                <Label htmlFor="product-category">Categoría *</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value) =>
                    setNewProduct({ ...newProduct, category: value })
                  }
                >
                  <SelectTrigger id="product-category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="product-barcode">
                  Código de Barras o Código Único *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="product-barcode"
                    value={newProduct.barcode}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, barcode: e.target.value })
                    }
                    placeholder="Ej: 7501055363057 o PROD001"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setNewProduct({
                        ...newProduct,
                        barcode: generateUniqueCode(),
                      })
                    }
                    title="Generar código único"
                  >
                    ✨
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {newProduct.barcode
                    ? "Código ingresado correctamente"
                    : "Presiona ✨ para generar un código único automáticamente"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="product-stock">Stock Actual *</Label>
                  <Input
                    id="product-stock"
                    type="number"
                    min="0"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: Number.parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="product-min-stock">Stock Mínimo *</Label>
                  <Input
                    id="product-min-stock"
                    type="number"
                    min="0"
                    value={newProduct.minStock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, minStock: Number.parseInt(e.target.value) || 0 })
                    }
                    placeholder="5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="product-price">Precio (opcional)</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: Number.parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="product-image">
                  Foto del Producto (opcional)
                </Label>
                {newProduct.image && (
                  <div className="mb-3 relative">
                    <img
                      src={newProduct.image}
                      alt="Preview"
                      className="w-full h-32 rounded-lg object-cover border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setNewProduct((prev) => ({
                          ...prev,
                          image: "",
                        }))
                      }
                      className="absolute top-2 right-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      document.getElementById("product-image")?.click()
                    }
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Cargar Foto
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Capturar
                  </Button>
                </div>
                <Input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>Consejo:</strong> Si escaneaste un código de barras
                  que no se encontró, este ya estará ingresado. Solo completa el
                  nombre y demás información.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddingProduct(false);
                    setNewProduct({
                      name: "",
                      barcode: "",
                      category: "",
                      stock: 0,
                      minStock: 0,
                      price: 0,
                      image: "",
                      description: "",
                      discount: 0,
                    });
                    setProductImage(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddProduct} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!editingProduct}
          onOpenChange={() => setEditingProduct(null)}
        >
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Editar Producto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Nombre del Producto</Label>
                <Input
                  id="productName"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Nombre del producto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productPrice">Precio (opcional)</Label>
                <Input
                  id="productPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      price: Number.parseFloat(e.target.value),
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Stock Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={editForm.minStock}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      minStock: Number.parseInt(e.target.value),
                    }))
                  }
                  placeholder="5"
                />
                <p className="text-xs text-muted-foreground">
                  Recibirás alertas cuando el stock sea igual o menor a este
                  valor
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={saveProductEdit} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Product Details Dialog */}
        <Dialog
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
        >
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-center">
                {selectedProduct?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <img
                  src={selectedProduct.image || "/placeholder.svg"}
                  alt={selectedProduct.name}
                  className="w-full h-48 mx-auto rounded-lg object-cover border"
                />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Código:</span>
                    <span className="font-medium">
                      {selectedProduct.barcode}
                    </span>
                  </div>
                  {selectedProduct.price > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Precio:</span>
                      <span className="font-medium text-primary">
                        ${selectedProduct.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stock mínimo:</span>
                    <span className="font-medium">
                      {selectedProduct.minStock} unidades
                    </span>
                  </div>
                </div>
                <div className="text-center py-4 bg-muted rounded-lg">
                  <div className="text-4xl font-bold mb-2">
                    {selectedProduct.stock}
                  </div>
                  <div
                    className={`text-lg font-medium ${
                      selectedProduct.stock <= selectedProduct.minStock
                        ? "text-amber-600"
                        : selectedProduct.stock === 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {selectedProduct.stock === 0
                      ? "Sin Stock"
                      : selectedProduct.stock <= selectedProduct.minStock
                      ? "Stock Bajo"
                      : "Stock Disponible"}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => updateStock(selectedProduct.id, -1)}
                    disabled={selectedProduct.stock === 0}
                    className="h-12 w-12 rounded-full"
                  >
                    <Minus className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => updateStock(selectedProduct.id, 1)}
                    className="h-12 w-12 rounded-full"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
                {selectedProduct.stock <= selectedProduct.minStock && (
                  <Button
                    className="w-full h-12 text-base"
                    onClick={() => {
                      setSelectedProduct(null);
                      setActiveTab("alerts");
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Ver Ofertas de Proveedores
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    deleteProduct(selectedProduct.id);
                    setSelectedProduct(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Producto
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal for adding product from offer */}
        <Dialog open={addingFromOfferModal} onOpenChange={setAddingFromOfferModal}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Agregar producto al inventario</DialogTitle>
            </DialogHeader>
            {selectedOfferProduct && (
              <div className="space-y-4">
                <div className="text-center">
                  <img
                    src={selectedOfferProduct.image || "/placeholder.svg"}
                    alt={selectedOfferProduct.name}
                    className="w-24 h-24 rounded object-cover mx-auto mb-2"
                  />
                  <h3 className="font-medium">{selectedOfferProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${selectedOfferProduct.price}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="quantity">Cantidad a agregar</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={offerProductQuantity}
                    onChange={(e) => setOfferProductQuantity(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAddingFromOfferModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={confirmAddFromOffer}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Sale Receipt Modal */}
        <Dialog open={showSaleReceipt} onOpenChange={setShowSaleReceipt}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Comprobante de Venta</DialogTitle>
            </DialogHeader>
            {currentSaleReceipt && (
              <div className="space-y-4">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <h3 className="font-bold">{loggedInUser?.storeName || "Mi Tienda"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentSaleReceipt.createdAt).toLocaleString("es-CO")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {currentSaleReceipt.id.slice(-8)}
                  </p>
                </div>

                {/* Customer */}
                {currentSaleReceipt.customerName && (
                  <div>
                    <p className="text-sm">
                      <strong>Cliente:</strong> {currentSaleReceipt.customerName}
                    </p>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="font-medium">Productos:</h4>
                  {currentSaleReceipt.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-muted-foreground">
                          ${item.unitPrice} x {item.quantity}
                          {item.discount > 0 && (
                            <span className="text-green-600 ml-1">
                              (-{item.discount}%)
                            </span>
                          )}
                        </p>
                      </div>
                      <span>${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${currentSaleReceipt.subtotal.toFixed(2)}</span>
                  </div>
                  {currentSaleReceipt.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuentos:</span>
                      <span>-${currentSaleReceipt.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-1">
                    <span>Total:</span>
                    <span>${currentSaleReceipt.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Notes */}
                {currentSaleReceipt.notes && (
                  <div className="border-t pt-2">
                    <p className="text-sm">
                      <strong>Notas:</strong> {currentSaleReceipt.notes}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground border-t pt-2">
                  <p>¡Gracias por su compra!</p>
                  <p>StockSync - Sistema de Inventario</p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setShowSaleReceipt(false)}
                >
                  Cerrar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
