# Quick Updates to Make

## Changes Needed in `/app/table-order/page.tsx`

### 1. Change ALL "Party Size" to "Number of People"

**Find and Replace:**
```
Find: "Party Size"
Replace: "Number of People"

Find: "Party of"
Replace with: (nothing - remove it)

Find: partySize
Replace: numberOfPeople
```

### 2. Update State Variables (Line 20-22)

**FROM:**
```tsx
const [partySize, setPartySize] = useState('1')
const [splitBill, setSplitBill] = useState(false)
const [splitPersons, setSplitPersons] = useState<string[]>([''])
```

**TO:**
```tsx
const [numberOfPeople, setNumberOfPeople] = useState('1')
const [splitBill, setSplitBill] = useState(false)
const [splitType, setSplitType] = useState<'equal' | 'unequal'>('equal')
const [splitPersons, setSplitPersons] = useState<{name: string, amount: string}[]>([{name: '', amount: ''}])
```

### 3. Add Appreciation Message at Top of Setup Screen (Line 272)

**ADD AFTER Line 276:**
```tsx
<div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6">
  <p className="text-sm text-center text-green-800 font-semibold">
    Thank you for choosing The Curry House Yokosuka!
    We're delighted to serve you today. 🙏
  </p>
</div>
```

### 4. Update Split Bill Section (Lines 338-392)

**REPLACE WITH:**
```tsx
{/* Split Bill Option */}
<div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
  <label className="flex items-center justify-between cursor-pointer">
    <div>
      <span className="block text-sm font-bold text-gray-700">Split Bill?</span>
      <span className="block text-xs text-gray-500">We're happy to split your bill any way you like!</span>
    </div>
    <input
      type="checkbox"
      checked={splitBill}
      onChange={(e) => {
        setSplitBill(e.target.checked)
        if (e.target.checked && splitPersons.length === 1) {
          setSplitPersons([{name: '', amount: ''}, {name: '', amount: ''}])
        }
      }}
      className="w-6 h-6 text-green-600 rounded focus:ring-green-500"
    />
  </label>

  {splitBill && (
    <div className="mt-4 space-y-4">
      {/* Split Type Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setSplitType('equal')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
            splitType === 'equal'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Split Equally
        </button>
        <button
          onClick={() => setSplitType('unequal')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
            splitType === 'unequal'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Split Custom Amounts
        </button>
      </div>

      {splitType === 'equal' ? (
        /* Equal Split */
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Enter Names
          </label>
          {splitPersons.map((person, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={person.name}
                onChange={(e) => {
                  const newPersons = [...splitPersons]
                  newPersons[index] = {...person, name: e.target.value}
                  setSplitPersons(newPersons)
                }}
                placeholder={`Person ${index + 1} name`}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
              {splitPersons.length > 1 && (
                <button
                  onClick={() => setSplitPersons(splitPersons.filter((_, i) => i !== index))}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setSplitPersons([...splitPersons, {name: '', amount: ''}])}
            className="w-full py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold text-sm mt-2"
          >
            + Add Person
          </button>
          <p className="text-xs text-green-600 mt-2 font-semibold">
            ✨ Bill will be split equally between everyone
          </p>
        </div>
      ) : (
        /* Unequal Split */
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Enter Names & Custom Amounts
          </label>
          <p className="text-xs text-gray-600 mb-3">Perfect for when people order different amounts!</p>
          {splitPersons.map((person, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={person.name}
                onChange={(e) => {
                  const newPersons = [...splitPersons]
                  newPersons[index] = {...person, name: e.target.value}
                  setSplitPersons(newPersons)
                }}
                placeholder="Name"
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-sm"
              />
              <input
                type="number"
                value={person.amount}
                onChange={(e) => {
                  const newPersons = [...splitPersons]
                  newPersons[index] = {...person, amount: e.target.value}
                  setSplitPersons(newPersons)
                }}
                placeholder="¥ Amount"
                className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-sm"
              />
              {splitPersons.length > 1 && (
                <button
                  onClick={() => setSplitPersons(splitPersons.filter((_, i) => i !== index))}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setSplitPersons([...splitPersons, {name: '', amount: ''}])}
            className="w-full py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold text-sm mt-2"
          >
            + Add Person
          </button>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              💡 <strong>Tip:</strong> Custom amounts let you split based on what each person ordered. You can adjust these amounts anytime!
            </p>
          </div>
        </div>
      )}
    </div>
  )}
</div>
```

### 5. Add Appreciation in Order Confirmation (After Line 414)

**REPLACE Lines 411-434 WITH:**
```tsx
if (orderSubmitted) {
  const validSplitPersons = splitBill ? splitPersons.filter(p => p.name.trim() !== '') : []
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center p-4">
      <div className="text-center bg-white rounded-2xl p-8 max-w-md shadow-2xl">
        <div className="text-8xl mb-6">✨</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Thank You!</h1>
        <p className="text-lg text-gray-700 mb-4">Your order has been sent to our kitchen</p>

        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-800 font-semibold">
            We truly appreciate your visit and can't wait to serve you delicious food! Your satisfaction means everything to us. 🙏
          </p>
        </div>

        <div className="space-y-2 text-gray-700 mb-6">
          <p className="text-2xl font-bold text-green-600">Table {selectedTables.join(', ')}</p>
          <p className="text-lg">{customerName}</p>
          <p className="text-sm text-gray-500">{numberOfPeople} {parseInt(numberOfPeople) === 1 ? 'person' : 'people'}</p>
          {splitBill && validSplitPersons.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <p className="text-sm font-bold text-blue-900 mb-2">Bill Split Details</p>
              <div className="text-xs text-blue-800 space-y-1">
                {splitType === 'equal' ? (
                  validSplitPersons.map((person, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span>{person.name}</span>
                      <span className="font-bold">{formatPrice(getCartTotal() / validSplitPersons.length)}</span>
                    </div>
                  ))
                ) : (
                  validSplitPersons.map((person, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span>{person.name}</span>
                      <span className="font-bold">{formatPrice(parseFloat(person.amount) || 0)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4">
          <p className="text-xs text-orange-800">
            ⏱️ Your fresh, delicious meal will be ready shortly. Thank you for your patience!
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 6. Update Header in Main Ordering Screen (Line 448)

**REPLACE Line 448 WITH:**
```tsx
<p className="text-green-100 text-xs sm:text-sm">{customerName} • {numberOfPeople} {parseInt(numberOfPeople) === 1 ? 'person' : 'people'}</p>
```

### 7. Update Split Calculation in Header (Lines 453-457)

**REPLACE WITH:**
```tsx
{splitBill && splitPersons.filter(p => p.name.trim() !== '').length > 0 && (
  <div className="text-xs text-green-200 mt-1">
    {splitType === 'equal'
      ? `${formatPrice(getCartTotal() / splitPersons.filter(p => p.name.trim() !== '').length)} per person`
      : 'Custom split amounts'
    }
  </div>
)}
```

---

## Image Size Adjustments

**Line 495:** Menu item image size
```tsx
<!-- CURRENT: -->
<div className="relative w-24 h-24 sm:w-28 sm:h-28 ...">

<!-- TO MAKE LARGER: -->
<div className="relative w-32 h-32 sm:w-40 sm:h-40 ...">

<!-- ADJUST w-XX and h-XX to your preference -->
<!-- See IMAGE_SIZE_GUIDE.md for all size options -->
```

---

## Summary of Changes

1. ✅ All "Party Size" → "Number of People"
2. ✅ Removed "Party of" text
3. ✅ Added appreciation messages (top, confirmation, bottom)
4. ✅ Added Equal/Unequal split options
5. ✅ Added custom amount input for unequal splits
6. ✅ Better UI with helpful tips
7. ✅ Image size guide provided

**Next:** You can adjust these manually or I can apply them all in one go!
