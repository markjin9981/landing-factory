import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationConfig } from '../../types';
import { Menu, X } from 'lucide-react';

interface Props {
    config: NavigationConfig;
    siteTitle: string;
    isMobileView?: boolean;
    landingId: string;
}

const NavigationBar: React.FC<Props> = ({ config, siteTitle, isMobileView, landingId }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

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
        } else if (!link.startsWith('http')) {
            // Internal Page Navigation (e.g. 'gallery', 'board')
            e.preventDefault();
            navigate(`/${landingId}/${link}`);
        }
        // If http/https, let default behavior handle it (external link)
    };

    return (
        <>
            <nav
                className={`w-full z-40 transition-all ${isSticky ? 'sticky top-0 shadow-md' : 'relative'}`}
                style={{ backgroundColor, color: textColor }}
            >
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    {/* Logo / Title */}
                    <div className="flex items-center gap-4">
                        {config.showHome && (
                            <button
                                onClick={() => navigate(`/${landingId}`)}
                                className="p-2 -ml-2 rounded-full hover:bg-gray-100/10 transition-colors"
                                title="Home"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                                    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                                </svg>
                            </button>
                        )}
                        <div className="font-bold text-xl truncate cursor-pointer" onClick={() => navigate(`/${landingId}`)}>
                            {siteTitle}
                        </div>
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
