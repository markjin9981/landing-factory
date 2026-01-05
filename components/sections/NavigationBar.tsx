import React, { useState } from 'react';
import { NavigationConfig } from '../../types';
import { Menu, X } from 'lucide-react';

interface Props {
    config: NavigationConfig;
    siteTitle: string;
    isMobileView?: boolean;
}

const NavigationBar: React.FC<Props> = ({ config, siteTitle, isMobileView }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!config || !config.isShow) return null;

    const { backgroundColor = '#ffffff', textColor = '#333333', items, isSticky } = config;

    const handleLinkClick = (e: React.MouseEvent<HTMLElement>, link: string) => {
        setMobileMenuOpen(false);
        if (link.startsWith('#')) {
            e.preventDefault();
            const id = link.substring(1);
            const element = document.getElementById(id);
            if (!element) return;

            const offset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
        // If not hash link, let default behavior handle it (external link)
    };

    return (
        <>
            <nav
                className={`w-full z-40 transition-all ${isSticky ? 'sticky top-0 shadow-md' : 'relative'}`}
                style={{ backgroundColor, color: textColor }}
            >
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    {/* Logo / Title */}
                    <div className="font-bold text-xl truncate cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        {siteTitle}
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        {items?.map((item, idx) => (
                            <a
                                key={idx}
                                href={item.link}
                                onClick={(e) => handleLinkClick(e, item.link)}
                                className="text-sm font-medium hover:opacity-70 transition-opacity"
                                style={{ color: textColor }}
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 -mr-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{ color: textColor }}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>

                    {/* Menu Content */}
                    <div
                        className="absolute top-0 right-0 w-64 h-full shadow-2xl p-6 flex flex-col"
                        style={{ backgroundColor, color: textColor }}
                    >
                        <div className="flex justify-between items-center mb-8">
                            <span className="font-bold text-lg">{siteTitle}</span>
                            <button onClick={() => setMobileMenuOpen(false)}><X /></button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {items?.map((item, idx) => (
                                <a
                                    key={idx}
                                    href={item.link}
                                    onClick={(e) => handleLinkClick(e, item.link)}
                                    className="text-left text-lg font-medium py-2 border-b border-white/10"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NavigationBar;
