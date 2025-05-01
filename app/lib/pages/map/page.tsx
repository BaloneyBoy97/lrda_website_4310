"use client";
import React, { useState, useRef, useEffect } from "react";
import SearchBarUI from "@/app/lib/components/search_bar_ui";
import { Note, CombinedResult } from "../../../types";
import { useGoogleMaps } from "../../utils/GoogleMapsContext";

interface SearchBarMapProps {
  onSearch: (
    address: string,
    lat?: number,
    lng?: number,
    isNoteClick?: boolean
  ) => void;
  onNotesSearch: (searchText: string) => void;
  isLoaded: boolean;
  filteredNotes?: Note[]; // make optional
}

const SearchBarMap: React.FC<SearchBarMapProps> = ({
  onSearch,
  onNotesSearch,
  isLoaded,
  filteredNotes = [], // ✅ default fallback
}) => {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const { isMapsApiLoaded } = useGoogleMaps();

  useEffect(() => {
    if (window.google?.maps?.places && !autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, [isMapsApiLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchText(query);
    setIsDropdownVisible(true);
    setLoading(true);

    if (query.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions({ input: query }, handlePredictions);
      onNotesSearch(query);
    } else {
      setSuggestions([]);
      if (query.length === 0) {
        onSearch("");
        onNotesSearch("");
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const typedLocation = searchText.trim();
      if (typedLocation) {
        onSearch(typedLocation);
        setIsDropdownVisible(false);
      }
    }
  };

  const handlePredictions = (
    predictions: google.maps.places.AutocompletePrediction[] | null,
    status: google.maps.places.PlacesServiceStatus
  ) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
      setSuggestions(predictions);
    } else {
      setSuggestions([]);
    }
    setLoading(false);
  };

  const handleSelectSuggestion = (placeId: string) => {
    if (isLoaded && window.google?.maps?.places) {
      const placesService = new window.google.maps.places.PlacesService(document.createElement("div"));
      placesService.getDetails({ placeId }, handlePlaceDetails);
    }
  };

  const handlePlaceDetails = (
    result: google.maps.places.PlaceResult | null,
    status: google.maps.places.PlacesServiceStatus
  ) => {
    if (
      status === google.maps.places.PlacesServiceStatus.OK &&
      result?.geometry?.location
    ) {
      const lat = result.geometry.location.lat();
      const lng = result.geometry.location.lng();
      onSearch(result.formatted_address || "", lat, lng);
      setSearchText(result.formatted_address || "");
      setSuggestions([]);
      setIsDropdownVisible(false);
    }
  };

  const handleNoteSelection = (note: CombinedResult) => {
    if (note.type === "note") {
      const lat = parseFloat(note.latitude);
      const lng = parseFloat(note.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        onSearch(note.title, lat, lng, true);
        setSearchText(note.title);
        setIsDropdownVisible(false);
      }
    }
  };

  const handleFocus = () => setIsDropdownVisible(true);
  const handleBlur = () => setTimeout(() => setIsDropdownVisible(false), 200);

  const typedLocation = searchText
    ? [{ description: searchText, place_id: "typed-location", type: "suggestion" as const }]
    : [];

  const combinedResults: CombinedResult[] = [
    ...typedLocation.map((loc) => ({
      ...loc,
      matched_substrings: [],
      structured_formatting: { main_text: loc.description, main_text_matched_substrings: [], secondary_text: "" },
      terms: [],
      types: [],
    })),
    ...suggestions.map((s) => ({ ...s, type: "suggestion" as const })),
    ...filteredNotes.filter((n) => n && n.title).map((n) => ({ ...n, type: "note" as const })),
  ];

  combinedResults.sort((a, b) => {
    const textA = "description" in a ? a.description || "" : a.title || "";
    const textB = "description" in b ? b.description || "" : b.title || "";
    return textA.localeCompare(textB);
  });

  return (
    <div className="flex flex-col w-full relative">
      <SearchBarUI
        searchText={searchText}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isDropdownVisible && (
        <ul
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 rounded-md bg-white shadow-lg max-h-60 overflow-auto top-full"
        >
          {loading && (
            <li className="flex items-center px-4 py-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500"></div>
              <span className="ml-2">Loading...</span>
            </li>
          )}
          {!loading && combinedResults.map((result) => {
            const isSuggestion = result.type === "suggestion";
            const key = isSuggestion ? result.place_id : result.id;
            const displayText = isSuggestion ? result.description : result.title;

            const onClick = () => {
              if (isSuggestion) {
                if (result.place_id === "typed-location") {
                  onSearch(result.description);
                  setSearchText(result.description);
                  setIsDropdownVisible(false);
                } else {
                  handleSelectSuggestion(result.place_id);
                }
              } else {
                handleNoteSelection(result);
              }
            };

            return (
              <li
                key={key}
                className="flex items-center px-4 py-2 hover:bg-blue-100 cursor-pointer transition-colors"
                onClick={onClick}
              >
                <img
                  src={isSuggestion ? "/autocomplete_map_pin.png" : "/autocomplete_search_icon.png"}
                  alt={isSuggestion ? "Map Pin" : "Search Icon"}
                  className="h-4 w-4 mr-2"
                />
                {displayText}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SearchBarMap;
