"use client";

import { useState, useRef, useCallback, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ_ITEMS } from "@/lib/constants";

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const panelId = `faq-panel-${id}`;
  const triggerId = `faq-trigger-${id}`;

  return (
    <div className="border-b border-border-light/70 last:border-b-0">
      <button
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-6 text-left transition-colors duration-200 hover:text-charcoal focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2 rounded-lg"
      >
        <span className={cn(
          "font-medium text-base lg:text-[17px] transition-colors duration-200",
          isOpen ? "text-charcoal" : "text-text-primary"
        )}>
          {question}
        </span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-text-tertiary flex-shrink-0 transition-all duration-300 ease-out",
            isOpen && "rotate-180 text-sage"
          )}
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className="overflow-hidden transition-[max-height,opacity] duration-350 ease-out"
        style={{
          maxHeight: isOpen ? contentRef.current?.scrollHeight ?? 200 : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="pb-6 pr-10">
          <p className="text-text-secondary text-sm sm:text-[15px] leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <section id="faq" className="py-24 lg:py-32 bg-ivory-warm">
      <div className="section-container">
        <div className="text-center mb-14 lg:mb-18">
          <h2 className="section-heading">
            Common questions
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem
              key={i}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === i}
              onToggle={() => handleToggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
