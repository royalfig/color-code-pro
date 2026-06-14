import { PALETTE_LABELS } from "@/lib/const";
import { LANG_SHORT } from "@/lib/languages";
import type { PaletteKind } from "@/types";
import { Select } from "@base-ui/react/select";
import { ChevronDown, ChevronUp, ChevronsUpDown, Check } from "lucide-react";
import "./Select.css";

export function LangSelect({
  handleLangChange,
  lang,
}: {
  handleLangChange: (newLang: string) => void;
  lang: string;
}) {
  // const currentLabel = LANG_SHORT[lang];

  const handleValChange = (val: string | null) => {
    if (!val) return;
    handleLangChange(val);
  };

  return (
    <div className="fs-field">
      <Select.Root
        items={LANG_SHORT}
        onValueChange={handleValChange}
        value={lang}
      >
        {/*<Select.Label className="fs-select-label">{currentLabel}</Select.Label>*/}
        <Select.Trigger className="fs-select-trigger">
          <Select.Value
            className="fs-trigger-value"
            placeholder="Select language"
          />
          <Select.Icon>
            <ChevronsUpDown size={12} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="" sideOffset={4}>
            <Select.Popup className="fs-popup fs-select-popup">
              <Select.ScrollUpArrow className="fs-scroll-arrow">
                <ChevronUp size={12} />
              </Select.ScrollUpArrow>
              <Select.List className="fs-select-list">
                {Object.entries(LANG_SHORT).map(([value, label]) => (
                  <Select.Item
                    key={label}
                    value={value}
                    className="fs-select-item"
                  >
                    <Select.ItemIndicator className="fs-list-indicator">
                      <Check size={"1em"} />
                    </Select.ItemIndicator>
                    <Select.ItemText className="fs-list-text">
                      {label}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className="fs-scroll-arrow">
                <ChevronDown size={12} />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

export function PaletteKindSelect({
  setPaletteKind,
  paletteKind,
}: {
  setPaletteKind: (kind: PaletteKind) => void;
  paletteKind: PaletteKind;
}) {
  const handleValChange = (val: string | null) => {
    if (!val) return;
    setPaletteKind(val as PaletteKind);
  };

  return (
    <div className="fs-field">
      <Select.Root
        items={PALETTE_LABELS}
        onValueChange={handleValChange}
        value={paletteKind}
      >
        <Select.Trigger className="fs-select-trigger">
          <Select.Value
            className="fs-trigger-value"
            placeholder="Palette kind"
          />
          <Select.Icon>
            <ChevronsUpDown size={12} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="" sideOffset={4}>
            <Select.Popup className="fs-popup fs-select-popup">
              <Select.ScrollUpArrow className="fs-scroll-arrow">
                <ChevronUp size={12} />
              </Select.ScrollUpArrow>
              <Select.List className="fs-select-list">
                {(
                  Object.entries(PALETTE_LABELS) as [PaletteKind, string][]
                ).map(([value, label]) => (
                  <Select.Item
                    key={value}
                    value={value}
                    className="fs-select-item"
                  >
                    <Select.ItemIndicator className="fs-list-indicator">
                      <Check size={"1em"} />
                    </Select.ItemIndicator>
                    <Select.ItemText className="fs-list-text">
                      {label}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className="fs-scroll-arrow">
                <ChevronDown size={12} />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
