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
    <div className="border-b border-ivory/20 last:border-b-0">
      <button
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-6 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-bloom focus-visible:outline-offset-2 rounded-lg"
      >
        <span className={cn(
          "font-medium text-base lg:text-[17px] transition-colors duration-200",
          isOpen ? "text-ivory" : "text-ivory/85"
        )}>
          {question}
        </span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-ivory/50 flex-shrink-0 transition-all duration-300 ease-out",
            isOpen && "rotate-180 text-bloom"
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
          <p className="text-ivory/70 text-sm sm:text-[15px] leading-relaxed">
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
    <section id="faq" className="section-full text-ivory">
      {/* Heading parked in a sticky left column on wide screens so it stays
          with the list as you read down it. */}
      <div className="section-container relative z-10 w-full py-28 grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-bloom mb-5">FAQ</p>
          <h2 className="display-lg text-ivory">Common questions</h2>
        </div>

        <div className="border-t border-ivory/20">
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
