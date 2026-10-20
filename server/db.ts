import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { 
  User, 
  Product, 
  Order, 
  FinancialTransaction, 
  AdBanner, 
  PasswordResetRequest, 
  AppSettings 
} from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  orders: Order[];
  transactions: FinancialTransaction[];
  ads: AdBanner[];
  passwordResetRequests: PasswordResetRequest[];
  settings: AppSettings;
}

const defaultSettings: AppSettings = {
  storeName: 'بلدي - متجر أحلى بقالة',
  logo: '',
  bannerImage: '',
  currency: 'ج.م',
  deliveryFee: 15,
  commissionPercent: 5,
  instapayHandle: 'baladi@instapay',
  instapayPhone: '01012345678',
  vodafoneCashNumber: '01098765432',
  captainModeEnabled: false,
  termsAndConditions: 'ميثاق الجودة وسياسة المتجر: جميع منتجات المتجر تخضع للفرز الأول وضمان الجودة الفائقة. يلتزم التاجر بتسليم خضار وفاكهة ومجففات وألبان طازجة وسليمة 100%. في حال وجود أي منتج تالف أو مخالف للمواصفات، يتم الاسترجاع فوراً مجاناً وبدون أي مصاريف إضافية على العميل، مع تحميل التاجر كامل المسؤولية.',
  returnPolicy: 'يحق للعميل معاينة الطلب عند الاستلام ورفض أو استبدال أي صنف غير مطابق للجودة دون أي تكاليف نقل أو خدمة إضافية.',
  whatsappBannedMerchantTemplate: 'مرحباً تاجرنا العزيز {merchant_name}، نود إعلامكم بإيقاف متجركم مؤقتاً على منصة بلدي بسبب: {reason}. يرجى اتباع الآتي لإعادة التفعيل: {steps}.',
  whatsappPasswordResetTemplate: 'مرحباً بك {user_name}، بيانات الدخول الخاصة بحسابك في متجر بلدي: البريد/الهاتف: {login_id}، كلمة المرور: {password}.',
  whatsappDeliveryRepTemplate: 'مرحباً {customer_name}، طلبك رقم {order_id} خرج للتوصيل الآن! المندوب اتحرك: اسمه {rep_name}، تليفونه: {rep_phone}.'
};

const initialUsers: User[] = [
  {
    id: 'admin-1',
    name: 'الإدارة المركزية',
    email: 'www.bekalte.com',
    phone: '01000000000',
    password: 'Aa&9119045',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'merchant-1',
    name: 'الحاج إبراهيم رضوان',
    storeName: 'مزرعة بلدي للخضار والفاكهة الطازجة',
    email: 'merchant@baladi.com',
    phone: '01011223344',
    password: '123456',
    role: 'merchant',
    isBanned: false,
    debt: 0,
    totalSales: 0,
    ordersCount: 0,
    address: {
      governorate: 'القاهرة',
      city: 'المعادي',
      street: 'شارع النصر الرئيسي',
      building: '12',
      landmark: 'بجوار ميدان الجزائر'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'merchant-2',
    name: 'الشيخ عطية للأعشاب',
    storeName: 'عطارة ومجففات الواحة',
    email: 'attar@baladi.com',
    phone: '01022334455',
    password: '123456',
    role: 'merchant',
    isBanned: false,
    debt: 0,
    totalSales: 0,
    ordersCount: 0,
    address: {
      governorate: 'الجيزة',
      city: 'الدقي',
      street: 'شارع مصدق',
      building: '8',
      landmark: 'أمام محطة المترو'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'customer-1',
    name: 'أحمد محمود السيد',
    email: 'ahmed@gmail.com',
    phone: '01122334455',
    password: '123456',
    role: 'customer',
    isBanned: false,
    address: {
      governorate: 'القاهرة',
      city: 'مدينة نصر',
      street: 'شارع عباس العقاد',
      building: '45',
      landmark: 'بجوار الحديقة الدولية'
    },
    createdAt: new Date().toISOString()
  }
];

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    merchantId: 'merchant-1',
    merchantName: 'مزرعة بلدي للخضار والفاكهة الطازجة',
    name: 'طماطم بلدي فرز أول قطفة الفجر',
    description: 'طماطم بلدي حمراء طازجة، صلبة ومثالية للسلطة والطهي.',
    category: 'خضروات',
    price: 15,
    unit: 'كيلو',
    stock: 120,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
    isHidden: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    merchantId: 'merchant-1',
    merchantName: 'مزرعة بلدي للخضار والفاكهة الطازجة',
    name: 'خيار صوب مزارع مقرمش',
    description: 'خيار بلدي طازج مقرمش خالي من المبيدات، مناسب للإفطار والعشاء.',
    category: 'خضروات',
    price: 18,
    unit: 'كيلو',
    stock: 80,
    image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=800&auto=format&fit=crop&q=80',
    isHidden: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    merchantId: 'merchant-1',
    merchantName: 'مزرعة بلدي للخضار والفاكهة الطازجة',
    name: 'بطاطس تحمير سيلانا ذهبية',
    description: 'بطاطس تحمير مقرمشة جداً لا تشرب زيت، فرز أول نظيف.',
    category: 'خضروات',
    price: 20,
    unit: 'كيلو',
    stock: 250,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop&q=80',
    isHidden: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-4',
    merchantId: 'merchant-1',
    merchantName: 'مزرعة بلدي للخضار والفاكهة الطازجة',
    name: 'برتقال بصرة بلدي سكري',
    description: 'برتقال بصرة مروي بمياه عذبة، طعم حلو وغني بفيتامين سي.',
    category: 'فواكه',
    price: 22,
    unit: 'كيلو',
    stock: 95,
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800&auto=format&fit=crop&q=80',
    isHidden: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-5',
    merchantId: 'merchant-1',
    merchantName: 'مزرعة بلدي للخضار والفاكهة الطازجة',
    name: 'تفاح مصري سكري بلدي',
    description: 'تفاح بلدي رائحة مميزة ومذاق طبيعي لا يقاوم.',
    category: 'فواكه',
    price: 45,
    unit: 'كيلو',
    stock: 60,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&auto=format&fit=crop&q=80',
    isHidden: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-6',
    merchantId: 'merchant-1',
    merchantName: 'مزرعة بلدي للخضار والفاكهة الطازجة',
    name: 'جبنة قريش فلاحي بلدي زبدة',
    description: 'جبنة قريش طبيعية 100% بدون أي زيوت مهدرجة، ملح خفيف.',
    category: 'أجبان وألبان',
    price: 85,
    unit: 'كيلو',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=800&auto=format&fit=crop&q=80',
    isHidden: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-7',
    merchantId: 'merchant-2',
    merchantName: 'عطارة ومجففات الواحة',
    name: 'فول تدميس بلدي عريض حبة كاملة',
    description: 'فول تدميس بلدي استواء زبدة، إنتاج صعيدي ممتاز.',
    category: 'بقوليات وحبوب',
    price: 50,
    unit: 'كيلو',
    stock: 150,
    image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800&auto=format&fit=crop&q=80',
    isHidden: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-8',
    merchantId: 'merchant-2',
    merchantName: 'عطارة ومجففات الواحة',
    name: 'عدس أصفر نقي درجة أولى',
    description: 'عدس أصفر سريع الطهي للشوربة المصرية الشتوية اللذيذة.',
    category: 'بقوليات وحبوب',
    price: 65,
    unit: 'كيلو',
    stock: 110,
    image: 'https://images.unsplash.com/photo-1585849834908-3481231155e8?w=800&auto=format&fit=crop&q=80',
    isHidden: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-9',
    merchantId: 'merchant-2',
    merchantName: 'عطارة ومجففات الواحة',
    name: 'نعناع بلدي مجفف ريحة فواحة',
    description: 'نعناع بلدي من مزارع أسوان مجفف بالظل ومفروم ناعم ونظيف.',
    category: 'مجففات وعطارة',
    price: 20,
    unit: 'كيس',
    stock: 75,
    image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=800&auto=format&fit=crop&q=80',
    isHidden: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-10',
    merchantId: 'merchant-2',
    merchantName: 'عطارة ومجففات الواحة',
    name: 'كمون بلدي حب مجفف منقى',
    description: 'كمون بلدي أصلي منقى يدوياً خالي من الشوائب والأتربة.',
    category: 'مجففات وعطارة',
    price: 45,
    unit: 'طبق',
    stock: 85,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80',
    isHidden: false,
    createdAt: new Date().toISOString()
  }
];

const initialAds: AdBanner[] = [
  {
    id: 'ad-1',
    title: 'عروض الخضار الطازج - فرز أول يومياً',
    description: 'خصومات تصل إلى 20% على الطماطم والبطاطس والخيار البلدي من المزرعة مباشرة لباب بيتك!',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
    type: 'top_banner',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all arrays and settings exist
        return {
          users: parsed.users || initialUsers,
          products: parsed.products || initialProducts,
          orders: parsed.orders || [],
          transactions: parsed.transactions || [],
          ads: parsed.ads || initialAds,
          passwordResetRequests: parsed.passwordResetRequests || [],
          settings: { ...defaultSettings, ...(parsed.settings || {}) }
        };
      }
    } catch (e) {
      console.error('Error loading database, reinitializing defaults:', e);
    }

    const initial: DatabaseSchema = {
      users: initialUsers,
      products: initialProducts,
      orders: [],
      transactions: [],
      ads: initialAds,
      passwordResetRequests: [],
      settings: defaultSettings
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database to file:', e);
    }
  }

  public getDb(): DatabaseSchema {
    return this.data;
  }

  public updateDb(updater: (db: DatabaseSchema) => void): DatabaseSchema {
    updater(this.data);
    this.saveData();
    return this.data;
  }
}

export const db = new DatabaseManager();
