'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  settings: Record<string, string>;
}

export function Footer({ settings }: FooterProps) {
  const footerDescription = settings['footer_description'] || 'Your premium destination for the latest gadgets and electronics.';
  const footerCopyright = settings['footer_content'] || `© ${new Date().getFullYear()} NEEDIE_STORE. All rights reserved.`;
  const contactEmail = settings['contact_email'] || 'hello@neediestore.com';
  const contactPhone = settings['contact_phone'] || '+1 (555) 123-4567';
  const contactAddress = settings['contact_address'] || '123 Store Street, City, Country';
  const socialFacebook = settings['social_facebook'] || '#';
  const socialInstagram = settings['social_instagram'] || '#';
  const socialYoutube = settings['social_youtube'] || '#';

  return (
    <footer className="bg-[#0B1120] text-white pt-20 pb-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand & Newsletter */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center">
              <div className="relative h-10 w-40">
                <Image 
                  src="https://res.cloudinary.com/byngla/image/upload/v1764928332/webstore/rezxlvheluvbsrbted8o.png"
                  alt="NeedieShop"
                  fill
                  className="object-contain brightness-0 invert"
                  referrerPolicy="no-referrer"
                />
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">{footerDescription}</p>
          </div>

          {/* Top Gadgets */}
          <div>
            <h3 className="text-lg font-bold mb-6 tracking-tight">Top Gadgets</h3>
            <ul className="space-y-4">
              <li><Link href="/category/smartphones" className="text-sm text-gray-400 hover:text-white transition-colors">Smartphones</Link></li>
              <li><Link href="/category/laptops" className="text-sm text-gray-400 hover:text-white transition-colors">Laptops</Link></li>
              <li><Link href="/category/audio" className="text-sm text-gray-400 hover:text-white transition-colors">Audio & Headphones</Link></li>
              <li><Link href="/category/wearables" className="text-sm text-gray-400 hover:text-white transition-colors">Wearables</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-bold mb-6 tracking-tight">Support</h3>
            <ul className="space-y-4">
              <li><Link href="/faq" className="text-sm text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/track-order" className="text-sm text-gray-400 hover:text-white transition-colors">Track Order</Link></li>
              <li><Link href="/returns" className="text-sm text-gray-400 hover:text-white transition-colors">Returns & Warranty</Link></li>
              <li><Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 tracking-tight">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-5 h-5 shrink-0 text-[#8B183A]" strokeWidth={2} />
                <span className="text-sm">{contactAddress}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Mail className="w-5 h-5 shrink-0 text-[#8B183A]" strokeWidth={2} />
                <span className="text-sm">{contactEmail}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone className="w-5 h-5 shrink-0 text-[#8B183A]" strokeWidth={2} />
                <span className="text-sm">{contactPhone}</span>
              </li>
            </ul>
            <div className="mt-6 flex gap-4">
              <Link href={socialFacebook} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#8B183A] transition-colors">
                <Facebook className="w-5 h-5" strokeWidth={2} />
              </Link>
              <Link href={socialInstagram} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#8B183A] transition-colors">
                <Instagram className="w-5 h-5" strokeWidth={2} />
              </Link>
              <Link href={socialYoutube} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#8B183A] transition-colors">
                <Youtube className="w-5 h-5" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500 font-medium">
            {footerCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
