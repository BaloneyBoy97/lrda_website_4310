import React from 'react';
import { Input } from "@/components/ui/input";

type SearchBarUIProps = {
  searchText: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; // ✅ Added
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  className?: string;
};

class SearchBarUI extends React.Component<SearchBarUIProps> {
  render() {
    const {
      searchText,
      onInputChange,
      onKeyDown, // Added
      onFocus,
      onBlur,
      className
    } = this.props;

    return (
      <div className="flex flex-col w-full">
        <Input
          type="text"
          placeholder="🔍 Search..."
          className={className || "border-2 border-gray-300 focus:border-blue-500 rounded-full py-2 px-4 w-full bg-white shadow-sm transition-all focus:ring-2 focus:ring-blue-300 outline-none"}
          value={searchText}
          onChange={onInputChange}
          onKeyDown={onKeyDown} // Added
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
    );
  }
}

export default SearchBarUI;
