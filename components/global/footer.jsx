"use client";

import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Instagram, Send, Headphones, ShieldCheck, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-800 text-white mt-12">
      {/* Top Features Bar */}
      <div className="bg-slate-700 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-bold text-sm">احراز هویت میزبانان</p>
                <p className="text-xs text-gray-300">میزبانان احراز و تایید هویت شده</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-bold text-sm">پشتیبانی ۲۴/۷</p>
                <p className="text-xs text-gray-300">پشتیبانی ۲۴ ساعته در ۷ روز هفته</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-bold text-sm">تماس با پشتیبانی</p>
                <p className="text-xs text-gray-300" dir="ltr">021-91692932</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto py-10 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and About */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/logo.webp"
                alt="تریپ گود"
                width={90}
                height={90}
                className="rounded-2xl shadow-2xl border-2 border-white/20 group-hover:scale-105 transition-transform duration-300"
              />
              <span className="text-2xl font-bold text-white">تریپ گود</span>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed">
              تریپ گود سامانه‌ای قابل اعتماد برای تمام افرادی است که به دنبال ثبت، پیداکردن و رزرو اقامتگاه در سراسر ایران به صورت آنلاین هستند.
            </p>
            {/* Social Media */}
            <div className="flex items-center gap-3 pt-2">
              <a href="https://t.me/tripgood" target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 p-2 rounded-full transition-colors">
                <Send className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/tripgood" target="_blank" rel="noopener noreferrer" className="bg-slate-600 hover:bg-pink-500 p-2 rounded-full transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold border-b border-slate-600 pb-2">درباره تریپ گود</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-green-400 text-sm transition-colors">
                  چگونه میزبان شوم؟
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-green-400 text-sm transition-colors">
                  قوانین و مقررات
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-300 hover:text-green-400 text-sm transition-colors">
                  تماس با ما
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-300 hover:text-green-400 text-sm transition-colors">
                  سوالات متداول
                </Link>
              </li>
              <li>
                <Link href="/magazine" className="text-gray-300 hover:text-green-400 text-sm transition-colors">
                  مجله تریپ گود
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold border-b border-slate-600 pb-2">خدمات</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/search?type=properties" className="text-gray-300 hover:text-green-400 text-sm transition-colors">
                  رزرو اقامتگاه
                </Link>
              </li>
              <li>
                <Link href="/search?type=buses" className="text-gray-300 hover:text-green-400 text-sm transition-colors">
                  رزرو بلیط اتوبوس
                </Link>
              </li>
              <li>
                <Link href="/search?type=foods" className="text-gray-300 hover:text-green-400 text-sm transition-colors">
                  سفارش غذای خانگی
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-300 hover:text-green-400 text-sm transition-colors">
                  پنل کاربری
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold border-b border-slate-600 pb-2">تماس با ما</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-300 text-sm">
                <Phone className="w-4 h-4 text-green-400" />
                <span dir="ltr">021-91692932</span>
              </li>
              <li className="flex items-center gap-2 text-gray-300 text-sm">
                <Mail className="w-4 h-4 text-green-400" />
                <span>info@tripgood.ir</span>
              </li>
              <li className="flex items-start gap-2 text-gray-300 text-sm">
                <MapPin className="w-4 h-4 text-green-400 mt-1" />
                <span>تهران - شهرستان : دماوند - بخش : رودهن - شهر : رودهن - محله : (رودهن) - بزرگراه (دوراهی رودهن) -خیابان حضرت آیت اله خامنه ای - پلاک : 0.0 - طبقه : همکف - کدپستی: 3973188981</span>
              </li>
            </ul>
            
            {/* Trust Badges */}
            <div className="flex items-center gap-3 pt-4">
              <a 
                referrerPolicy="origin"
                target="_blank"
                href="bbbbbbbbbb"
                className="bg-white rounded-lg p-1"
              >
                <img 
                  referrerPolicy="origin"
                  src="cccccccccc" 
                  alt="نماد اعتماد الکترونیکی" 
                  className="w-16 h-16"
                  style={{ cursor: "pointer" }}
                />
              </a>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KCTxwYXRoIGQ9Im0xMjAgMjQzbDk0LTU0IDAtMTA5IC05NCA1NCAwIDEwOSAwIDB6IiBmaWxsPSIjODA4Mjg1Ii8+Cgk8cGF0aCBkPSJtMTIwIDI1NGwtMTAzLTYwIDAtMTE5IDEwMy02MCAxMDMgNjAgMCAxMTkgLTEwMyA2MHoiIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS13aWR0aDo1O3N0cm9rZTojMDBhZWVmIi8+Cgk8cGF0aCBkPSJtMjE0IDgwbC05NC01NCAtOTQgNTQgOTQgNTQgOTQtNTR6IiBmaWxsPSIjMDBhZWVmIi8+Cgk8cGF0aCBkPSJtMjYgODBsMCAxMDkgOTQgNTQgMC0xMDkgLTk0LTU0IDAgMHoiIGZpbGw9IiM1ODU5NWIiLz4KCTxwYXRoIGQ9Im0xMjAgMTU3bDQ3LTI3IDAtMjMgLTQ3LTI3IC00NyAyNyAwIDU0IDQ3IDI3IDQ3LTI3IiBzdHlsZT0iZmlsbDpub25lO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2Utd2lkdGg6MTU7c3Ryb2tlOiNmZmYiLz4KCTx0ZXh0IHg9IjE1IiB5PSIzMDAiIGZvbnQtc2l6ZT0iMjVweCIgZm9udC1mYW1pbHk9IidCIFlla2FuJyIgc3R5bGU9ImZpbGw6IzI5Mjk1Mjtmb250LXdlaWdodDpib2xkIj7Yudi22Ygg2KfYqtit2KfYr9uM2Ycg2qnYtNmI2LHbjDwvdGV4dD4KCTx0ZXh0IHg9IjgiIHk9IjM0MyIgZm9udC1zaXplPSIyNXB4IiBmb250LWZhbWlseT0iJ0IgWWVrYW4nIiBzdHlsZT0iZmlsbDojMjkyOTUyO2ZvbnQtd2VpZ2h0OmJvbGQiPtqp2LPYqCDZiCDaqdin2LHZh9in24wg2YXYrNin2LLbjDwvdGV4dD4KPC9zdmc+"
                alt="اتحادیه کسب و کارهای مجازی"
                onClick={() => window.open('dddddddddd', 'Popup', 'toolbar=no,location=no,statusbar=no,menubar=no,scrollbars=1,resizable=0,width=580,height=600,top=30')}
                style={{ cursor: "pointer", width: "96px", height: "144px" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-slate-900 py-4">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} کلیه حقوق این سایت محفوظ و متعلق به تریپ گود است.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
