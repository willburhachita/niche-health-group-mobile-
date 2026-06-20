import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Download, RefreshCw, Trash2, Save, FileSpreadsheet, Bold, Italic, AlignLeft, AlignCenter, AlignRight, HelpCircle } from 'lucide-react';
import { Button, Input, Select, Badge, Spinner } from '../../components/ui';
import { format } from 'date-fns';

interface CellData {
  raw: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string;
  bg?: string;
}

type GridData = Record<string, CellData>;

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROWS = Array.from({ length: 30 }, (_, i) => i + 1);

const INITIAL_GRID: GridData = {
  'A1': { raw: 'Invoice #', bold: true, align: 'center', bg: '#f3f4f6' },
  'B1': { raw: 'Inv Date', bold: true, align: 'center', bg: '#f3f4f6' },
  'C1': { raw: 'Inv Amount', bold: true, align: 'center', bg: '#f3f4f6' },
  'D1': { raw: 'Expense Desc', bold: true, align: 'center', bg: '#f3f4f6' },
  'E1': { raw: 'Exp Date', bold: true, align: 'center', bg: '#f3f4f6' },
  'F1': { raw: 'Exp Amount', bold: true, align: 'center', bg: '#f3f4f6' },
  'G1': { raw: 'Payment Ref', bold: true, align: 'center', bg: '#f3f4f6' },
  'H1': { raw: 'Pay Date', bold: true, align: 'center', bg: '#f3f4f6' },
  'I1': { raw: 'Pay Amount', bold: true, align: 'center', bg: '#f3f4f6' },
};

export default function LedgerWorkbook() {
  const [grid, setGrid] = useState<GridData>(() => {
    const saved = localStorage.getItem('niche_ledger_workbook');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return INITIAL_GRID;
  });

  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>('');
  const [showFormulaHelp, setShowFormulaHelp] = useState<boolean>(false);

  // Live queries for imports
  const invoices = useQuery(api.invoices.list, {});
  const expenses = useQuery(api.expenses.list, {});
  const payments = useQuery(api.paymentsClinic.list, {});

  // Persist grid changes
  useEffect(() => {
    localStorage.setItem('niche_ledger_workbook', JSON.stringify(grid));
  }, [grid]);

  // Helper to parse cell coordinate
  const parseCellRef = (ref: string) => {
    const match = ref.match(/^([A-J])([1-9][0-9]*)$/i);
    if (!match) return null;
    return { col: match[1].toUpperCase(), row: parseInt(match[2], 10) };
  };

  const getCellRaw = (ref: string, gridData: GridData) => {
    return gridData[ref]?.raw || '';
  };

  // Evaluate single cell
  const resolveCell = (cellRef: string, gridData: GridData, visited = new Set<string>()): number | string => {
    if (visited.has(cellRef)) return '#REF!';
    visited.add(cellRef);

    const raw = getCellRaw(cellRef, gridData).trim();
    if (!raw) return '';
    if (!raw.startsWith('=')) {
      const num = Number(raw);
      return isNaN(num) || raw === '' ? raw : num;
    }

    try {
      const expr = raw.slice(1).toUpperCase();

      // Functions: SUM, AVERAGE, MIN, MAX
      const sumMatch = expr.match(/^SUM\(([A-J]\d+):([A-J]\d+)\)$/);
      if (sumMatch) {
        const vals = getRangeValues(sumMatch[1], sumMatch[2], gridData, visited);
        return vals.reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
      }

      const avgMatch = expr.match(/^AVERAGE\(([A-J]\d+):([A-J]\d+)\)$/);
      if (avgMatch) {
        const vals = getRangeValues(avgMatch[1], avgMatch[2], gridData, visited).filter(v => typeof v === 'number') as number[];
        if (vals.length === 0) return 0;
        return vals.reduce((sum, v) => sum + v, 0) / vals.length;
      }

      const minMatch = expr.match(/^MIN\(([A-J]\d+):([A-J]\d+)\)$/);
      if (minMatch) {
        const vals = getRangeValues(minMatch[1], minMatch[2], gridData, visited).filter(v => typeof v === 'number') as number[];
        if (vals.length === 0) return 0;
        return Math.min(...vals);
      }

      const maxMatch = expr.match(/^MAX\(([A-J]\d+):([A-J]\d+)\)$/);
      if (maxMatch) {
        const vals = getRangeValues(maxMatch[1], maxMatch[2], gridData, visited).filter(v => typeof v === 'number') as number[];
        if (vals.length === 0) return 0;
        return Math.max(...vals);
      }

      // Basic cell references: e.g. A1 + B2
      const cellRegex = /([A-J]\d+)/g;
      const evalExpr = expr.replace(cellRegex, (match) => {
        const val = resolveCell(match, gridData, visited);
        return typeof val === 'number' ? String(val) : '0';
      });

      // Safely evaluate standard math expressions
      if (/^[0-9+\-*/().\s]+$/.test(evalExpr)) {
        const res = new Function(`return (${evalExpr})`)();
        return typeof res === 'number' && !isNaN(res) ? res : '#ERR!';
      }

      return '#ERR!';
    } catch (e) {
      return '#ERR!';
    }
  };

  const getRangeValues = (start: string, end: string, gridData: GridData, visited: Set<string>): (number | string)[] => {
    const startLoc = parseCellRef(start);
    const endLoc = parseCellRef(end);
    if (!startLoc || !endLoc) return [];

    const colStart = startLoc.col.charCodeAt(0);
    const colEnd = endLoc.col.charCodeAt(0);
    const rowStart = Math.min(startLoc.row, endLoc.row);
    const rowEnd = Math.max(startLoc.row, endLoc.row);

    const minCol = Math.min(colStart, colEnd);
    const maxCol = Math.max(colStart, colEnd);

    const values: (number | string)[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      const colName = String.fromCharCode(c);
      for (let r = rowStart; r <= rowEnd; r++) {
        const ref = `${colName}${r}`;
        values.push(resolveCell(ref, gridData, new Set(visited)));
      }
    }
    return values;
  };

  // Evaluate the cell for display
  const getCellDisplayValue = (ref: string) => {
    const val = resolveCell(ref, grid);
    if (typeof val === 'number') {
      return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
    return val;
  };

  // Handle cell edit save
  const saveCellEdit = () => {
    setGrid(prev => ({
      ...prev,
      [selectedCell]: {
        ...(prev[selectedCell] || {}),
        raw: editValue
      }
    }));
    setIsEditing(false);
  };

  // Move selected cell on key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        saveCellEdit();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
      }
      return;
    }

    const loc = parseCellRef(selectedCell);
    if (!loc) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(true);
      setEditValue(grid[selectedCell]?.raw || '');
    } else if (e.key === 'ArrowUp' && loc.row > 1) {
      e.preventDefault();
      setSelectedCell(`${loc.col}${loc.row - 1}`);
    } else if (e.key === 'ArrowDown' && loc.row < 30) {
      e.preventDefault();
      setSelectedCell(`${loc.col}${loc.row + 1}`);
    } else if (e.key === 'ArrowLeft' && loc.col !== 'A') {
      e.preventDefault();
      const prevCol = String.fromCharCode(loc.col.charCodeAt(0) - 1);
      setSelectedCell(`${prevCol}${loc.row}`);
    } else if (e.key === 'ArrowRight' && loc.col !== 'J') {
      e.preventDefault();
      const nextCol = String.fromCharCode(loc.col.charCodeAt(0) + 1);
      setSelectedCell(`${nextCol}${loc.row}`);
    }
  };

  // Cell style modifiers
  const toggleStyle = (styleKey: 'bold' | 'italic') => {
    setGrid(prev => ({
      ...prev,
      [selectedCell]: {
        ...(prev[selectedCell] || {}),
        [styleKey]: !prev[selectedCell]?.[styleKey]
      }
    }));
  };

  const changeAlign = (align: 'left' | 'center' | 'right') => {
    setGrid(prev => ({
      ...prev,
      [selectedCell]: {
        ...(prev[selectedCell] || {}),
        align
      }
    }));
  };

  const changeColor = (color: string) => {
    setGrid(prev => ({
      ...prev,
      [selectedCell]: {
        ...(prev[selectedCell] || {}),
        color: color || undefined
      }
    }));
  };

  const changeBg = (bg: string) => {
    setGrid(prev => ({
      ...prev,
      [selectedCell]: {
        ...(prev[selectedCell] || {}),
        bg: bg || undefined
      }
    }));
  };

  // Reset Workbook
  const handleReset = () => {
    if (!confirm('Are you sure you want to reset the workbook to initial state?')) return;
    setGrid(INITIAL_GRID);
    setSelectedCell('A1');
    setIsEditing(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    ROWS.forEach(r => {
      const rowData = COLUMNS.map(c => {
        const val = resolveCell(`${c}${r}`, grid);
        const cellString = val === undefined || val === null ? "" : String(val);
        // Escape quotes
        return `"${cellString.replace(/"/g, '""')}"`;
      });
      csvContent += rowData.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clinic_financial_ledger_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import operations
  const importInvoices = () => {
    if (!invoices) { alert('Invoice records are loading...'); return; }
    if (!confirm('Import live active invoice records into Columns A-C (starting Row 2)? This overrides existing data in those cells.')) return;
    
    setGrid(prev => {
      const newGrid = { ...prev };
      // Write header
      newGrid['A1'] = { raw: 'Invoice #', bold: true, align: 'center', bg: '#e0e7ff' };
      newGrid['B1'] = { raw: 'Inv Date', bold: true, align: 'center', bg: '#e0e7ff' };
      newGrid['C1'] = { raw: 'Inv Amount', bold: true, align: 'center', bg: '#e0e7ff' };
      
      const activeInvs = invoices.filter(i => !i.isArchived).slice(0, 28);
      activeInvs.forEach((inv, index) => {
        const row = index + 2;
        newGrid[`A${row}`] = { raw: inv.invoiceNumber, align: 'left' };
        newGrid[`B${row}`] = { raw: format(new Date(inv.date), 'dd-MMM-yyyy'), align: 'center' };
        newGrid[`C${row}`] = { raw: String(inv.total), align: 'right' };
      });
      return newGrid;
    });
    alert('Invoices imported successfully!');
  };

  const importExpenses = () => {
    if (!expenses) { alert('Expense records are loading...'); return; }
    if (!confirm('Import live expense records into Columns D-F (starting Row 2)? This overrides existing data in those cells.')) return;
    
    setGrid(prev => {
      const newGrid = { ...prev };
      newGrid['D1'] = { raw: 'Expense Desc', bold: true, align: 'center', bg: '#fee2e2' };
      newGrid['E1'] = { raw: 'Exp Date', bold: true, align: 'center', bg: '#fee2e2' };
      newGrid['F1'] = { raw: 'Exp Amount', bold: true, align: 'center', bg: '#fee2e2' };
      
      const activeExps = expenses.filter(e => !e.isArchived).slice(0, 28);
      activeExps.forEach((exp, index) => {
        const row = index + 2;
        newGrid[`D${row}`] = { raw: exp.description, align: 'left' };
        newGrid[`E${row}`] = { raw: format(new Date(exp.date), 'dd-MMM-yyyy'), align: 'center' };
        newGrid[`F${row}`] = { raw: String(exp.amount), align: 'right' };
      });
      return newGrid;
    });
    alert('Expenses imported successfully!');
  };

  const importPayments = () => {
    if (!payments) { alert('Payment records are loading...'); return; }
    if (!confirm('Import live payments collected into Columns G-I (starting Row 2)? This overrides existing data in those cells.')) return;
    
    setGrid(prev => {
      const newGrid = { ...prev };
      newGrid['G1'] = { raw: 'Payment Ref', bold: true, align: 'center', bg: '#dcfce7' };
      newGrid['H1'] = { raw: 'Pay Date', bold: true, align: 'center', bg: '#dcfce7' };
      newGrid['I1'] = { raw: 'Pay Amount', bold: true, align: 'center', bg: '#dcfce7' };
      
      const activePays = payments.slice(0, 28);
      activePays.forEach((pay, index) => {
        const row = index + 2;
        newGrid[`G${row}`] = { raw: pay.referenceNumber || pay.method, align: 'left' };
        newGrid[`H${row}`] = { raw: format(new Date(pay.paymentDate), 'dd-MMM-yyyy'), align: 'center' };
        newGrid[`I${row}`] = { raw: String(pay.amount), align: 'right' };
      });
      return newGrid;
    });
    alert('Payments imported successfully!');
  };

  // Selected cell raw data
  const currentCellRaw = grid[selectedCell]?.raw || '';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 shadow-sm">
      {/* Spreadsheet Control Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-navy/5 text-navy rounded-xl">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Interactive Accounting Spreadsheet</h3>
            <p className="text-[11px] text-gray-400">Formula-driven interactive workbook integrated directly with live clinic database operations.</p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" variant="outline" icon={<RefreshCw size={13} />} onClick={importInvoices} className="text-blue-600 border-blue-100 hover:bg-blue-50">Invoices</Button>
          <Button size="sm" variant="outline" icon={<RefreshCw size={13} />} onClick={importExpenses} className="text-red-600 border-red-100 hover:bg-red-50">Expenses</Button>
          <Button size="sm" variant="outline" icon={<RefreshCw size={13} />} onClick={importPayments} className="text-green-600 border-green-100 hover:bg-green-50">Payments</Button>
          
          <div className="w-px h-6 bg-gray-200 mx-1" />
          
          <Button size="sm" variant="outline" icon={<Download size={13} />} onClick={handleExportCSV}>Export CSV</Button>
          <Button size="sm" variant="outline" icon={<HelpCircle size={13} />} onClick={() => setShowFormulaHelp(p => !p)} className="text-gray-500">Formulas</Button>
          <Button size="sm" variant="outline" icon={<Trash2 size={13} />} onClick={handleReset} className="text-red-500 border-red-100 hover:bg-red-50">Clear</Button>
        </div>
      </div>

      {/* Formula guide helper */}
      {showFormulaHelp && (
        <div className="bg-navy/5 text-navy border border-navy/10 rounded-xl p-3 text-xs space-y-1.5 leading-relaxed">
          <p className="font-bold">💡 Formula Parser Guide:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Start your formulas with <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">=</code>. Cell names are coordinate strings (e.g. <code className="font-mono bg-white/80 px-1 py-0.5 rounded">C2</code>, <code className="font-mono bg-white/80 px-1 py-0.5 rounded">F2</code>).</li>
            <li><strong>Aggregate Functions:</strong> <code className="font-mono bg-white/80 px-1 rounded">=SUM(C2:C15)</code>, <code className="font-mono bg-white/80 px-1 rounded">=AVERAGE(F2:F20)</code>, <code className="font-mono bg-white/80 px-1 rounded">=MIN(I2:I10)</code>, <code className="font-mono bg-white/80 px-1 rounded">=MAX(I2:I10)</code></li>
            <li><strong>Basic Equations:</strong> <code className="font-mono bg-white/80 px-1 rounded">=C2-F2</code>, <code className="font-mono bg-white/80 px-1 rounded">=(C2+I2)*0.84</code>, <code className="font-mono bg-white/80 px-1 rounded">=C2/1.16</code></li>
            <li>Double-click a cell to edit inline or type in the formula bar below. Use arrow keys to navigate the grid.</li>
          </ul>
        </div>
      )}

      {/* Formatting & Formula Bar */}
      <div className="flex flex-col md:flex-row gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
        {/* Style Buttons */}
        <div className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <button 
            onClick={() => toggleStyle('bold')} 
            className={`p-1.5 rounded hover:bg-gray-100 transition ${grid[selectedCell]?.bold ? 'bg-gray-200 text-gray-900 font-bold' : 'text-gray-500'}`}
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button 
            onClick={() => toggleStyle('italic')} 
            className={`p-1.5 rounded hover:bg-gray-100 transition ${grid[selectedCell]?.italic ? 'bg-gray-200 text-gray-900 italic' : 'text-gray-500'}`}
            title="Italic"
          >
            <Italic size={14} />
          </button>

          <div className="w-px h-4 bg-gray-200 mx-1" />

          {(['left', 'center', 'right'] as const).map(align => (
            <button
              key={align}
              onClick={() => changeAlign(align)}
              className={`p-1.5 rounded hover:bg-gray-100 transition ${grid[selectedCell]?.align === align ? 'bg-gray-200 text-gray-900' : 'text-gray-500'}`}
              title={`Align ${align}`}
            >
              {align === 'left' && <AlignLeft size={14} />}
              {align === 'center' && <AlignCenter size={14} />}
              {align === 'right' && <AlignRight size={14} />}
            </button>
          ))}

          <div className="w-px h-4 bg-gray-200 mx-1" />

          {/* Color pickers */}
          <select 
            value={grid[selectedCell]?.color || ''} 
            onChange={e => changeColor(e.target.value)}
            className="text-[11px] font-semibold text-gray-600 bg-transparent border-0 focus:ring-0 cursor-pointer"
          >
            <option value="">Text Color</option>
            <option value="#dc2626" style={{ color: '#dc2626' }}>Red</option>
            <option value="#2563eb" style={{ color: '#2563eb' }}>Blue</option>
            <option value="#16a34a" style={{ color: '#16a34a' }}>Green</option>
            <option value="#eab308" style={{ color: '#eab308' }}>Yellow</option>
            <option value="#111827" style={{ color: '#111827' }}>Dark</option>
          </select>

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          <select 
            value={grid[selectedCell]?.bg || ''} 
            onChange={e => changeBg(e.target.value)}
            className="text-[11px] font-semibold text-gray-600 bg-transparent border-0 focus:ring-0 cursor-pointer"
          >
            <option value="">Fill Color</option>
            <option value="#fee2e2" style={{ backgroundColor: '#fee2e2' }}>Red Light</option>
            <option value="#dbeafe" style={{ backgroundColor: '#dbeafe' }}>Blue Light</option>
            <option value="#dcfce7" style={{ backgroundColor: '#dcfce7' }}>Green Light</option>
            <option value="#fef9c3" style={{ backgroundColor: '#fef9c3' }}>Yellow Light</option>
            <option value="#f3f4f6" style={{ backgroundColor: '#f3f4f6' }}>Grey Light</option>
          </select>
        </div>

        {/* Formula Input */}
        <div className="flex-1 flex items-center bg-white rounded-lg border border-gray-200 px-3 shadow-sm min-h-[38px]">
          <span className="text-xs font-bold text-gray-400 select-none mr-2 font-mono">{selectedCell} : fx</span>
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={saveCellEdit}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm border-0 p-0 focus:ring-0 font-mono text-navy"
              autoFocus
            />
          ) : (
            <div 
              onClick={() => {
                setIsEditing(true);
                setEditValue(grid[selectedCell]?.raw || '');
              }}
              className="flex-1 text-sm font-mono text-navy cursor-text h-full flex items-center min-h-[20px]"
            >
              {currentCellRaw || <span className="text-gray-300 italic text-[11px]">Select cell or double click to input equation...</span>}
            </div>
          )}
        </div>
      </div>

      {/* Grid Container */}
      <div className="border border-gray-200 rounded-xl overflow-auto max-h-[500px] shadow-inner relative scrollbar-thin">
        <table className="w-full border-collapse text-xs select-none table-fixed">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="w-10 border-r border-b border-gray-200 bg-gray-200 p-1 text-center font-bold text-gray-500"></th>
              {COLUMNS.map(c => (
                <th key={c} className="w-28 border-r border-b border-gray-200 p-1 text-center font-bold text-gray-600 bg-gray-150 uppercase font-mono">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(r => (
              <tr key={r} className="hover:bg-gray-50/30">
                {/* Row Header */}
                <td className="sticky left-0 border-r border-b border-gray-200 bg-gray-100 p-1 text-center font-bold text-gray-500 font-mono select-none">
                  {r}
                </td>
                
                {/* Cells */}
                {COLUMNS.map(c => {
                  const ref = `${c}${r}`;
                  const isSelected = selectedCell === ref;
                  const cell = grid[ref] || { raw: '' };
                  const displayValue = getCellDisplayValue(ref);

                  // Custom classes
                  const alignment = cell.align === 'center' ? 'text-center' : cell.align === 'right' ? 'text-right' : 'text-left';
                  const weight = cell.bold ? 'font-bold' : 'font-normal';
                  const style = cell.italic ? 'italic' : '';

                  return (
                    <td
                      key={ref}
                      onClick={() => {
                        setSelectedCell(ref);
                        setIsEditing(false);
                      }}
                      onDoubleClick={() => {
                        setSelectedCell(ref);
                        setIsEditing(true);
                        setEditValue(cell.raw);
                      }}
                      tabIndex={0}
                      onKeyDown={handleKeyDown}
                      style={{
                        color: cell.color,
                        backgroundColor: isSelected ? undefined : cell.bg,
                      }}
                      className={`border-r border-b border-gray-100 p-1.5 truncate cursor-cell h-8 transition-all duration-75 relative outline-none ${alignment} ${weight} ${style} ${
                        isSelected 
                          ? 'ring-2 ring-navy ring-inset bg-navy/5 shadow-sm font-semibold' 
                          : ''
                      }`}
                    >
                      {isEditing && isSelected ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={saveCellEdit}
                          onKeyDown={handleKeyDown}
                          className="absolute inset-0 w-full h-full border-0 p-1.5 focus:ring-0 font-mono text-xs text-navy z-20"
                          autoFocus
                        />
                      ) : (
                        displayValue
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
