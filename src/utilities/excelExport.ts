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
 * Export data to an Excel file and trigger download
 */
export function exportToExcel(
    data: ExcelExportRow[],
    options: ExcelExportOptions
): void {
    const { filename, sheetName = 'Data', columnWidths } = options

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Set column widths if provided
    if (columnWidths && columnWidths.length > 0) {
        worksheet['!cols'] = columnWidths.map(width => ({ wch: width }))
    } else {
        // Auto-calculate column widths based on content
        const headers = Object.keys(data[0] || {})
        worksheet['!cols'] = headers.map(header => {
            // Get max length of content in this column
            const maxLength = Math.max(
                header.length,
                ...data.map(row => String(row[header] || '').length)
            )
            return { wch: Math.min(maxLength + 2, 50) } // Cap at 50 chars
        })
    }

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
            'Margin': row.margin,
            'Margin %': row.marginPercent,
            'All Candidates': allCandidates,
        }
    })
}
