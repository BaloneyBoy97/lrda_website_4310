import React, { useState, useEffect } from "react";
import { Note } from "../../types";
import { format12hourTime } from "../utils/data_conversion";
import ApiService from "../utils/api_service";

const BATCH_SIZE = 20;

type NoteListViewProps = {
  onNoteSelect: (note: Note, isNewNote: boolean) => void;
};

const extractTextFromHtml = (htmlString: string) => {
  const tempDivElement = document.createElement("div");
  tempDivElement.innerHTML = htmlString;
  return tempDivElement.textContent || tempDivElement.innerText || "";
};

const NoteListView: React.FC<NoteListViewProps> = ({ onNoteSelect }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [skip, setSkip] = useState(0);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotesBatch = async () => {
    setLoading(true);
    const newNotes = await ApiService.fetchPublishedNotes(BATCH_SIZE, skip);
    if (newNotes.length < BATCH_SIZE) {
      setHasMore(false;
    }
    setNotes(prev => [...prev, ...newNotes]);
    setSkip(prev => prev + BATCH_SIZE);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotesBatch();
  }, []);

  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      onNoteSelect(notes[0], false);
      setSelectedNoteId(notes[0].id);
    }
  }, [notes]);

  const handleLoadText = (note: Note) => {
    onNoteSelect(note, false);
    setSelectedNoteId(note.id);
  };

  const handleGetTime = (inputDate: Date) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const checkDate = new Date(inputDate);
    checkDate.setHours(0, 0, 0, 0);
    const dayDifference = (currentDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDifference === 0) return format12hourTime(inputDate);
    else if (dayDifference === 1) return "Yesterday";
    else return inputDate.toLocaleDateString();
  };

  return (
    <div className="my-4 flex flex-col" id="notes-list">
      {notes.map((note) => {
        const noteTextContent = extractTextFromHtml(note.text);
        if (note.isArchived) return null;
        return (
          <div
            key={note.id}
            className={`h-16 p-2 m-1 z-10 rounded truncate cursor-pointer ${
              note.id === selectedNoteId
                ? "bg-primary/90 text-popover"
                : "bg-popover text-primary hover:bg-primary/80"
            }`}
            onClick={() => handleLoadText(note)}
          >
            <div className="flex flex-col">
              <div className="flex flex-row items-center justify-between">
                <h3 className="text-lg font-semibold truncate">{note.title}</h3>
                <h3 className="text-sm font-semibold">{handleGetTime(note.time)}</h3>
              </div>
              <p className="text-sm truncate">{noteTextContent}</p>
            </div>
          </div>
        );
      })}
      {hasMore && (
        <button
          className="mx-auto mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={fetchNotesBatch}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
};

export default NoteListView;
