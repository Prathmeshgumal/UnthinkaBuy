import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              Unthinka<span className="text-primary">Buy</span>
            </h3>
            <p className="text-muted text-sm leading-relaxed">
              Your one-stop destination for amazing deals on quality products. Shop the unthinkable, save the
              unbelievable.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <Link href="#" className="text-muted hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["About Us", "Contact Us", "FAQ", "Terms & Conditions", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-muted text-sm hover:text-primary transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              {["Car & Motorbike", "Electronics", "Fashion", "Home & Kitchen", "Beauty & Health"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-muted text-sm hover:text-primary transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted text-sm">
                <Mail className="h-4 w-4 flex-shrink-0" />
                support@unthinkabuy.com
              </li>
              <li className="flex items-center gap-3 text-muted text-sm">
                <Phone className="h-4 w-4 flex-shrink-0" />
                +91 1800-123-4567
              </li>
              <li className="flex items-start gap-3 text-muted text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                123 Commerce Street, Tech Park, Bangalore - 560001
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-muted/20 mt-8 pt-8 text-center text-muted text-sm">
          <p>&copy; {new Date().getFullYear()} UnthinkaBuy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
