import * as XLSX from 'xlsx'

export interface ExcelExportRow {
    [key: string]: string | number | null
}

export interface ExcelExportOptions {
    filename: string
    sheetName?: string
    columnWidths?: number[]
}

/**
 * Export data to an Excel file and trigger download with IndiaStats branding
 */
export function exportToExcel(
    data: ExcelExportRow[],
    options: ExcelExportOptions
): void {
    const { filename, sheetName = 'Data', columnWidths } = options

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Create branding header rows with marketing content
    const brandingRows = [
        { '': '═══════════════════════════════════════════════════════════════════════════════' },
        { '': '                    ★★★  INDIASTATS.ORG  ★★★' },
        { '': '           India\'s Most Comprehensive Election Data Platform' },
        { '': '═══════════════════════════════════════════════════════════════════════════════' },
        { '': '' },
        { '': '🌐  WEBSITE:  https://indiastats.org' },
        { '': '🐦  TWITTER/X:  @india_stats_org' },
        { '': '' },
        { '': '✅  234 Assembly Constituencies  |  38 Districts  |  50,000+ Booths' },
        { '': '✅  Election Results from 1967 to 2021  |  Interactive Maps  |  Caste Demographics' },
        { '': '' },
        { '': `📅  Data Exported: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` },
        { '': '═══════════════════════════════════════════════════════════════════════════════' },
        { '': '' }, // Empty row before data
    ]

    // Get headers from data
    const headers = Object.keys(data[0] || {})
    const brandingRowCount = brandingRows.length

    // Create worksheet with branding first
    const worksheet = XLSX.utils.json_to_sheet(brandingRows, { skipHeader: true })

    // Append actual data with headers starting after branding
    XLSX.utils.sheet_add_json(worksheet, data, { origin: `A${brandingRowCount + 1}` })

    // Add footer after data
    const footerStartRow = brandingRowCount + data.length + 2
    const footerRows = [
        { '': '' },
        { '': '═══════════════════════════════════════════════════════════════════════════════' },
        { '': '📊  Explore more election data at:  https://indiastats.org' },
        { '': '🔗  Share this data! Tag us @india_stats_org on Twitter/X' },
        { '': '⭐  Open Source Project: github.com/dculussoftwares/indiastats-cms' },
        { '': '═══════════════════════════════════════════════════════════════════════════════' },
    ]
    XLSX.utils.sheet_add_json(worksheet, footerRows, { origin: `A${footerStartRow}`, skipHeader: true })

    // Set column widths
    if (columnWidths && columnWidths.length > 0) {
        worksheet['!cols'] = columnWidths.map(width => ({ wch: width }))
    } else {
        // Auto-calculate column widths based on content
        worksheet['!cols'] = headers.map(header => {
            // Get max length of content in this column
            const maxLength = Math.max(
                header.length,
                ...data.map(row => String(row[header] || '').length)
            )
            return { wch: Math.min(maxLength + 2, 50) } // Cap at 50 chars
        })
    }

    // Merge branding header cells across all columns for better appearance
    const merges = []
    for (let i = 0; i < brandingRowCount; i++) {
        merges.push({ s: { r: i, c: 0 }, e: { r: i, c: headers.length - 1 } })
    }
    // Merge footer rows
    for (let i = 0; i < footerRows.length; i++) {
        merges.push({ s: { r: footerStartRow - 1 + i, c: 0 }, e: { r: footerStartRow - 1 + i, c: headers.length - 1 } })
    }
    worksheet['!merges'] = merges

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Generate file and trigger download
    XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}

/**
 * Flatten nested candidate data for Excel export
 */
export interface FlatElectionRow {
    [key: string]: string | number | null
    'AC Name': string
    'AC No': number | null
    'District': string
    'Election Year': number
    'Total Electors': number | null
    'Total Votes': number | null
    'Poll %': number | null
    'Winner Name': string
    'Winner Party': string
    'Winner Votes': number
    'Runner-up Name': string
    'Runner-up Party': string
    'Runner-up Votes': number
    '2nd Runner-up Name': string
    '2nd Runner-up Party': string
    '2nd Runner-up Votes': number
    'Margin': number | null
    'Margin %': number | null
    'All Candidates': string
}

export function flattenElectionDataForExcel(
    data: Array<{
        acName: string
        acNo: number | null
        districtName: string
        electionYear: number
        totalElectors: number | null
        totalVotes: number | null
        pollPercent: number | null
        candidates: Array<{ name: string; party: string; votes: number; rank: number }>
        margin: number | null
        marginPercent: number | null
    }>
): FlatElectionRow[] {
    return data.map(row => {
        const winner = row.candidates[0] || { name: '', party: '', votes: 0 }
        const runnerUp = row.candidates[1] || { name: '', party: '', votes: 0 }
        const runnerUp2 = row.candidates[2] || { name: '', party: '', votes: 0 }

        // Create a string with all candidates
        const allCandidates = row.candidates
            .map(c => `${c.name} (${c.party}: ${c.votes.toLocaleString()})`)
            .join(' | ')

        return {
            'AC Name': row.acName,
            'AC No': row.acNo,
            'District': row.districtName,
            'Election Year': row.electionYear,
            'Total Electors': row.totalElectors,
            'Total Votes': row.totalVotes,
            'Poll %': row.pollPercent,
            'Winner Name': winner.name,
            'Winner Party': winner.party,
            'Winner Votes': winner.votes,
            'Runner-up Name': runnerUp.name,
            'Runner-up Party': runnerUp.party,
            'Runner-up Votes': runnerUp.votes,
            '2nd Runner-up Name': runnerUp2.name,
            '2nd Runner-up Party': runnerUp2.party,
            '2nd Runner-up Votes': runnerUp2.votes,
            'Margin': row.margin,
            'Margin %': row.marginPercent,
            'All Candidates': allCandidates,
        }
    })
}
