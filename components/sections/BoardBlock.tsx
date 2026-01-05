import React, { useState } from 'react';
import { BoardSection } from '../../types';
import { ChevronDown, ChevronUp, Megaphone, HelpCircle } from 'lucide-react';

interface Props {
    data: BoardSection;
    isMobileView?: boolean;
}

const BoardBlock: React.FC<Props> = ({ data, isMobileView }) => {
    const [openItems, setOpenItems] = useState<Set<string>>(new Set());

    if (!data.isShow || !data.items || data.items.length === 0) return null;

    const toggleItem = (id: string) => {
        const newSet = new Set(openItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setOpenItems(newSet);
    };

    const isAccordion = data.type === 'accordion';

    return (
        <section className="py-16 px-4 bg-gray-50" id="section-board">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <span className="inline-block p-3 rounded-full bg-white shadow-sm mb-4 text-blue-600">
                        {isAccordion ? <HelpCircle className="w-6 h-6" /> : <Megaphone className="w-6 h-6" />}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{data.title}</h2>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {data.items.map((item, idx) => {
                            const isOpen = openItems.has(item.id);
                            return (
                                <div key={item.id || idx} className="group">
                                    <button
                                        onClick={() => isAccordion && toggleItem(item.id)}
                                        className={`w-full px-6 py-5 flex items-start text-left hover:bg-gray-50 transition-colors gap-4 ${!isAccordion ? 'cursor-default' : ''}`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-gray-400 font-mono">{item.date}</span>
                                                {item.category && <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">{item.category}</span>}
                                            </div>
                                            <h3 className={`font-bold text-gray-800 ${isMobileView ? 'text-sm' : 'text-lg'} group-hover:text-blue-600 transition-colors`}>
                                                {isAccordion && <span className="text-blue-500 mr-2">Q.</span>}
                                                {item.title}
                                            </h3>
                                        </div>
                                        {isAccordion && (
                                            <div className={`mt-1 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="w-5 h-5" />
                                            </div>
                                        )}
                                    </button>

                                    {/* Content Area (Accordion Only) */}
                                    {isAccordion && (
                                        <div
                                            className={`bg-gray-50 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                        >
                                            <div className="px-6 py-6 text-gray-600 leading-relaxed border-t border-gray-100">
                                                <span className="font-bold text-blue-600 mr-2 text-lg float-left">A.</span>
                                                <div dangerouslySetInnerHTML={{ __html: item.content || '' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BoardBlock;
