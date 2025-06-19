import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Minus, Trash2, Download, Upload, Copy, Check } from "lucide-react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface Section {
  id: string;
  title: string;
  columns: Column[];
}

const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
};

const TrelloBoard: React.FC = () => {
  const [sections, setSections] = useLocalStorage<Section[]>("trello-sections", [
    {
      id: "1",
      title: "Project Planning",
      columns: [
        {
          id: "c1",
          title: "To Do",
          tasks: [
            { id: "t1", title: "Sample task 1", completed: false },
            { id: "t3", title: "Completed sample task", completed: true },
          ],
        },
        {
          id: "c2",
          title: "In Progress",
          tasks: [{ id: "t2", title: "Sample task 2", completed: false }],
        },
        { id: "c3", title: "Done", tasks: [] },
      ],
    },
    {
      id: "2",
      title: "Development",
      columns: [
        { id: "c4", title: "Backlog", tasks: [] },
        { id: "c5", title: "In Development", tasks: [] },
      ],
    },
  ]);

  const [draggedTask, setDraggedTask] = useState<{
    task: Task;
    fromSection: string;
    fromColumn: string;
  } | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      title: "New Section",
      columns: [{ id: `col-${Date.now()}`, title: "New Column", tasks: [] }],
    };
    setSections([...sections, newSection]);
  };

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter((section) => section.id !== sectionId));
  };

  const clearCompletedTasks = (sectionId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              columns: section.columns.map((col) => ({
                ...col,
                tasks: col.tasks.filter((task) => !task.completed),
              })),
            }
          : section
      )
    );
  };

  const editSectionTitle = (sectionId: string, newTitle: string) => {
    if (newTitle.trim()) {
      setSections(
        sections.map((section) =>
          section.id === sectionId ? { ...section, title: newTitle } : section
        )
      );
    }
    setEditingSection(null);
  };

  const addColumn = (sectionId: string) => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      title: "New Column",
      tasks: [],
    };
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, columns: [...section.columns, newColumn] }
          : section
      )
    );
  };

  const removeColumn = (sectionId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId && section.columns.length > 1
          ? { ...section, columns: section.columns.slice(0, -1) }
          : section
      )
    );
  };

  const editColumnTitle = (
    sectionId: string,
    columnId: string,
    newTitle: string
  ) => {
    if (newTitle.trim()) {
      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                columns: section.columns.map((col) =>
                  col.id === columnId ? { ...col, title: newTitle } : col
                ),
              }
            : section
        )
      );
    }
    setEditingColumn(null);
  };

  const addTask = (sectionId: string, columnId: string, taskTitle: string) => {
    if (taskTitle.trim()) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskTitle,
        completed: false,
      };
      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                columns: section.columns.map((col) =>
                  col.id === columnId
                    ? { ...col, tasks: [...col.tasks, newTask] }
                    : col
                ),
              }
            : section
        )
      );
    }
  };

  const deleteTask = (sectionId: string, columnId: string, taskId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              columns: section.columns.map((col) =>
                col.id === columnId
                  ? {
                      ...col,
                      tasks: col.tasks.filter((task) => task.id !== taskId),
                    }
                  : col
              ),
            }
          : section
      )
    );
  };

  const toggleTaskCompletion = (
    sectionId: string,
    columnId: string,
    taskId: string
  ) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              columns: section.columns.map((col) =>
                col.id === columnId
                  ? {
                      ...col,
                      tasks: col.tasks.map((task) =>
                        task.id === taskId
                          ? { ...task, completed: !task.completed }
                          : task
                      ),
                    }
                  : col
              ),
            }
          : section
      )
    );
  };

  const editTaskTitle = (
    sectionId: string,
    columnId: string,
    taskId: string,
    newTitle: string
  ) => {
    if (newTitle.trim()) {
      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                columns: section.columns.map((col) =>
                  col.id === columnId
                    ? {
                        ...col,
                        tasks: col.tasks.map((task) =>
                          task.id === taskId
                            ? { ...task, title: newTitle }
                            : task
                        ),
                      }
                    : col
                ),
              }
            : section
        )
      );
    }
    setEditingTask(null);
  };

  const handleDragStart = (
    task: Task,
    fromSection: string,
    fromColumn: string
  ) => {
    setDraggedTask({ task, fromSection, fromColumn });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent,
    toSectionId: string,
    toColumnId: string
  ) => {
    e.preventDefault();
    if (draggedTask) {
      // Remove task from source
      const updatedSections = sections.map((section) =>
        section.id === draggedTask.fromSection
          ? {
              ...section,
              columns: section.columns.map((col) =>
                col.id === draggedTask.fromColumn
                  ? {
                      ...col,
                      tasks: col.tasks.filter(
                        (task) => task.id !== draggedTask.task.id
                      ),
                    }
                  : col
              ),
            }
          : section
      );

      // Add task to target
      const finalSections = updatedSections.map((section) =>
        section.id === toSectionId
          ? {
              ...section,
              columns: section.columns.map((col) =>
                col.id === toColumnId
                  ? { ...col, tasks: [...col.tasks, draggedTask.task] }
                  : col
              ),
            }
          : section
      );

      setSections(finalSections);
      setDraggedTask(null);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(sections, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focustask-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          setSections(importedData);
        } else {
          alert('Invalid JSON format. Please select a valid FocusTask export file.');
        }
      } catch (error) {
        alert('Error reading file. Please select a valid JSON file.');
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const copySectionAsMarkdown = async (section: Section) => {
    const markdownLines: string[] = [];
    
    section.columns.forEach(column => {
      column.tasks.forEach(task => {
        const checkbox = task.completed ? '[x]' : '[ ]';
        markdownLines.push(`- ${checkbox} ${column.title}: ${task.title}`);
      });
    });
    
    const markdown = markdownLines.join('\n');
    
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedSection(section.id);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          FocusTask
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportData}
            className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
            title="Export Data"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={triggerImport}
            className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
            title="Import Data"
          >
            <Upload size={16} />
            Import
          </button>
          <button
            onClick={addSection}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add Section
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={importData}
        accept=".json"
        style={{ display: 'none' }}
      />

      <div className="bg-white border border-gray-300 overflow-hidden">
        {sections.map((section, sectionIndex) => (
          <div
            key={section.id}
            className={`${sectionIndex > 0 ? "border-t border-gray-300" : ""}`}
          >
            {/* Section Header */}
            <div className="flex justify-between items-center p-3 bg-white border-b border-gray-300 shadow-sm">
              <div className="flex items-center gap-4">
                {editingSection === section.id ? (
                  <input
                    type="text"
                    defaultValue={section.title}
                    onBlur={(e) => editSectionTitle(section.id, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        editSectionTitle(section.id, e.currentTarget.value);
                      }
                    }}
                    className="text-lg font-bold text-gray-800 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <h2
                    className="text-lg font-bold text-gray-800 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                    onClick={() => setEditingSection(section.id)}
                  >
                    {section.title}
                  </h2>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => copySectionAsMarkdown(section)}
                  className={`p-1.5 rounded transition-colors ${
                    copiedSection === section.id
                      ? "bg-green-200 text-green-600"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-600"
                  }`}
                  title="Copy as Markdown"
                >
                  {copiedSection === section.id ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
                <button
                  onClick={() => addColumn(section.id)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-600 p-1.5 rounded transition-colors"
                  title="Add Column"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => removeColumn(section.id)}
                  disabled={section.columns.length <= 1}
                  className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-600 disabled:text-gray-400 p-1.5 rounded transition-colors"
                  title="Remove Column"
                >
                  <Minus size={16} />
                </button>
                <button
                  onClick={() => clearCompletedTasks(section.id)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-600 p-1.5 rounded transition-colors"
                  title="Clear Completed Tasks"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => deleteSection(section.id)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-600 p-1.5 rounded transition-colors"
                  title="Delete Section"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Columns */}
            <div className="flex">
              {section.columns.map((column, columnIndex) => (
                <div
                  key={column.id}
                  className={`bg-gray-50 flex-1 min-w-0 ${
                    columnIndex > 0 ? "border-l border-gray-300" : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, section.id, column.id)}
                >
                  <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                    {editingColumn === column.id ? (
                      <input
                        type="text"
                        defaultValue={column.title}
                        onBlur={(e) =>
                          editColumnTitle(section.id, column.id, e.target.value)
                        }
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            editColumnTitle(
                              section.id,
                              column.id,
                              e.currentTarget.value
                            );
                          }
                        }}
                        className="font-semibold text-gray-700 text-sm bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                        autoFocus
                      />
                    ) : (
                      <h3
                        className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                        onClick={() => setEditingColumn(column.id)}
                      >
                        {column.title}
                      </h3>
                    )}
                  </div>

                  <div className="p-3 space-y-2 min-h-32">
                    {column.tasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() =>
                          handleDragStart(task, section.id, column.id)
                        }
                        className={`bg-white p-2 border border-gray-200 cursor-move shadow-sm hover:shadow-md transition-all group ${
                          task.completed ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() =>
                              toggleTaskCompletion(
                                section.id,
                                column.id,
                                task.id
                              )
                            }
                            className="w-4 h-4 accent-gray-500 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex justify-between items-center flex-1">
                            {editingTask === task.id ? (
                              <input
                                type="text"
                                defaultValue={task.title}
                                onBlur={(e) =>
                                  editTaskTitle(
                                    section.id,
                                    column.id,
                                    task.id,
                                    e.target.value
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    editTaskTitle(
                                      section.id,
                                      column.id,
                                      task.id,
                                      e.currentTarget.value
                                    );
                                  } else if (e.key === "Escape") {
                                    setEditingTask(null);
                                  }
                                }}
                                className="text-gray-800 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 flex-1 mr-2 text-sm"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span
                                className={`cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded flex-1 transition-colors text-sm ${
                                  task.completed
                                    ? "line-through text-gray-500"
                                    : "text-gray-800"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTask(task.id);
                                }}
                              >
                                {task.title}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(section.id, column.id, task.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all ml-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <AddTaskForm
                      onAddTask={(title) =>
                        addTask(section.id, column.id, title)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AddTaskForm: React.FC<{ onAddTask: (title: string) => void }> = ({
  onAddTask,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const handleSubmit = () => {
    if (taskTitle.trim()) {
      onAddTask(taskTitle);
      setTaskTitle("");
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="space-y-2">
        <textarea
          placeholder="Enter a title for this card..."
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          className="w-full p-2 border border-gray-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={2}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-2 py-1 text-sm rounded hover:bg-blue-600 transition-colors"
          >
            Add card
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setTaskTitle("");
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsAdding(true)}
      className="w-full text-left text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 text-sm transition-colors flex items-center gap-2"
    >
      <Plus size={14} />
      Add a card
    </button>
  );
};

export default TrelloBoard;
