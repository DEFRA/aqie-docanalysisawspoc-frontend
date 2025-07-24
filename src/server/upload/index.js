import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import util from 'util'
import { parsePdfToJson } from '../utils/pdfParser.js'
import { createLogger } from '../../server/common/helpers/logging/logger.js'
import { config } from '../../config/config.js'
import axios from 'axios'
import { log } from 'console'

const logger = createLogger()
const pump = util.promisify(pipeline)

export const upload = {
  plugin: {
    name: 'upload',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/upload',
          options: { auth: { strategy: 'login', mode: 'required' } },
          handler: (request, h) => {
            const user = request.auth.credentials.user
            const model = request.query.model || 'model1'
            return h.view('upload/index', {
              isAuthenticated: true,
              user: user,
              status: null,
              model: model,
            })
          }
        },
        {
          method: 'POST',
          path: '/upload',
          options: {
            auth: { strategy: 'login', mode: 'required' },
            payload: {
              output: 'stream',
              parse: true,
              multipart: true,
              maxBytes: 50 * 1024 * 1024, // 50MB limit
              allow: 'multipart/form-data',
              timeout: 5 * 60 * 1000
            },
            timeout: {
              server: 5 * 60 * 1000,
              socket: 6 * 60 * 1000
            }
          },
          handler: async (request, h) => {
            const { payload } = request
            const model = request.query.model || 'model1'
            const analysisType = payload?.analysisType || 'green'
            const file = payload?.policyPdf
            logger.info(analysisType);
            if (
              !file ||
              file.hapi.headers['content-type'] !== 'application/pdf'
            ) {
              return h.view('upload/index', {
                isAuthenticated: true,
                user: request.auth.credentials.user,
                status: 'error',
                message: 'Please upload a PDF file.',
                model: model,
                analysisType: payload?.analysisType || 'green'
              })
            }
            const uploadDir = path.join(process.cwd(), 'uploads')
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)
            const filename = `${Date.now()}-${file.hapi.filename}`
            const filepath = path.join(uploadDir, filename)
            await pump(file, fs.createWriteStream(filepath))

            try {

              const pdfText = await parsePdfToJson(filepath)
              await fs.unlinkSync(filepath)

              // Convert PDF text to a string for the API call
              const pdfTextContent = pdfText
                .map(page => page.content)
                .join('\n\n')

              try {

                const backendApiUrl = config.get('backendApiUrl');

                // Define different prompts based on analysis type
                const greenPrompt = `Evaluate the text based on the Green Book CENTRAL GOVERNMENT GUIDANCE ON APPRAISAL AND EVALUATION given below and
                            give a RAG report for the following evaluation metric along with a short summary for each criteria in a tabular format
                                For The Strategic Dimension 
                                critically Evaluate for DEFRA the Strategic Case of the attached business case based on the principles outlined in HM Treasury's Green Book. Your analysis should cover:
                                1. Case for Change: Critically Evaluate with conservative posture for Defra UK, Is there a compelling case for change? Does it clearly articulate the rationale for intervention and is it supported by objective evidence?
                                2. Business as Usual (BAU): Critically Evaluate with conservative posture for Defra UK, Has the BAU scenario been quantitatively defined to provide a clear benchmark for comparison?
                                3. SMART Objectives: Critically Evaluate with conservative posture for Defra UK, Are the objectives Specific, Measurable, Achievable, Realistic, and Time-limited (SMART)? Do they focus on outcomes rather than outputs?
                                4. Strategic Fit: Critically Evaluate with conservative posture for Defra UK, How well does this proposal align with wider government policies and the organization's strategic goals?
                                5. Constraints and Dependencies: Critically Evaluate with conservative posture for Defra UK, Have all significant external constraints (legal, ethical, etc.) and dependencies (e.g., other projects, infrastructure) been identified and addressed? "
                                For The Economic Dimension 
                                "Analyze the Economic Case of the business case in accordance with the Green Book's guidance on social value appraisal. Your evaluation must address:
                                1. Options Appraisal: Critically Evaluate with conservative posture for Defra UK, Was a comprehensive longlist of options considered using the options framework-filter, leading to a viable shortlist for detailed analysis? This should include a 'do-minimum' option.
                                2. Social Cost-Benefit Analysis (CBA) / Cost-Effectiveness Analysis (CEA): Critically Evaluate with conservative posture for Defra UK, Has the appropriate analysis (CBA or CEA) been used to compare shortlisted options? Are all significant social and environmental costs and benefits (monetized and unmonetized) to UK society included and valued appropriately?
                                3. Valuation: Critically Evaluate with conservative posture for Defra UK, Are valuations of costs and benefits based on market prices, or where not possible, approved non-market valuation techniques? Are costs and benefits presented in real terms and discounted using the correct Social Time Preference Rate (STPR)?
                                4. Risk and Optimism Bias: Critically Evaluate with conservative posture for Defra UK, Has optimism bias been explicitly and appropriately applied to costs, benefits, and timelines? Is there a clear risk register and has the cost of risk been properly estimated?
                                5. Value for Money (VfM): Critically Evaluate with conservative posture for Defra UK, Does the analysis present a clear Net Present Social Value (NPSV) and Benefit-Cost Ratio (BCR) for each option to determine the optimal VfM? Does the VfM judgment appropriately consider unquantifiable benefits and risks? "
                                For The Commercial Dimension 
                                "Assess the Commercial Case of the business case as per the Green Book framework. Your evaluation should focus on:
                                1. Commercial Viability: Critically Evaluate with conservative posture for Defra UK, Is the proposed commercial strategy realistic and credible? Can a viable deal be struck with the market?
                                2. Procurement Strategy: Critically Evaluate with conservative posture for Defra UK, Does the procurement specification logically follow from the strategic and economic cases? Has sufficient market appetite and capacity been assessed?
                                3. Risk Allocation: Critically Evaluate with conservative posture for Defra UK, Is there a clear and optimal allocation of risks between the public and private sectors? Is risk borne by the party best able to manage it?
                                4. Contractual Arrangements: Critically Evaluate with conservative posture for Defra UK, If Public-Private Partnership (PPP) options are considered, have they been robustly compared against a Public Sector Comparator? Is there sufficient contractual flexibility to handle future changes without incurring unacceptable costs? "
                                For The Financial Dimension 
                                "Evaluate the Financial Case of the business case using the principles from the Green Book. Your analysis must include:
                                1. Affordability: Critically Evaluate with conservative posture for Defra UK, Is the proposal affordable within the organization's current and future budget allocations?
                                2. Public Sector Cost: Critically Evaluate with conservative posture for Defra UK, Does the case accurately present the net financial impact on the public sector over the proposal's lifetime, including all capital and revenue costs?
                                3. Accounting and Budgeting: Critically Evaluate with conservative posture for Defra UK, Are costs calculated correctly according to National Accounts rules and presented on an accruals basis consistent with departmental budgets? Are financial statements (budget, cash flow, funding) provided and robust?
                                4. Contingency: Critically Evaluate with conservative posture for Defra UK, Is there a clear and appropriate financial contingency allowance derived from residual optimism bias and quantified risks, and is its purpose (to inform the approving authority's reserves) understood? "
                                For The Management Dimension 
                                "Assess the Management Case of the business case based on the Green Book's requirements for successful delivery. Your evaluation should examine:
                                1. Delivery Plan: Critically Evaluate with conservative posture for Defra UK, Is there a realistic and robust plan for implementation? Are there clear milestones, and is the timeline achievable?
                                2. Governance and Resources: Critically Evaluate with conservative posture for Defra UK, Is the organizational structure for governance and delivery clearly defined? Are the required resources (personnel, skills) available and properly managed?
                                3. Risk and Benefit Management: Critically Evaluate with conservative posture for Defra UK, Is there a comprehensive Risk Register with clear ownership and mitigation plans? Is there a Benefits Register to track the realization of expected benefits?
                                4. Monitoring and Evaluation: Critically Evaluate with conservative posture for Defra UK, Are there proportionate and budgeted plans for monitoring and evaluation before, during, and after implementation to track performance and learn lessons? "
                                For The IT Dimension 
                                "Drawing upon the principles of the Green Book's Five Case Model, evaluate the IT-specific aspects of this business case. Your assessment should consider:
                                1. Strategic Alignment (Strategic Case): Critically Evaluate with conservative posture for Defra UK, How does the proposed IT solution support the SMART objectives and overall business needs? Is there a risk of technological obsolescence, and how is it managed? Is the IT solution dependent on other infrastructure (e.g., connectivity) and is this dependency managed?
                                2. Value and Cost (Economic/Financial Cases): Critically Evaluate with conservative posture for Defra UK, Are the full whole-life costs of the IT system (including procurement, implementation, maintenance, and eventual replacement) accurately estimated and included in the appraisal? Is there a clear benefit realization plan for the IT investment?
                                3. Sourcing and Delivery (Commercial/Management Cases): Critically Evaluate with conservative posture for Defra UK, Has the procurement of IT been considered (e.g., build vs. buy, specific frameworks)? Does the management case reflect best practices for IT project delivery, such as Agile methodologies where appropriate?
                                4. Risk Management (Management Case): Critically Evaluate with conservative posture for Defra UK, Are IT-specific risks (e.g., data security, system integration, user adoption, supplier failure) identified and mitigated in the risk register?"
                                For The Official Development Assistance (ODA) Dimension 
                                "Evaluate this business case for its suitability as an Official Development Assistance (ODA) proposal, applying the core principles of the Green Book while adapting for the international development context. Your evaluation should cover:
                                1. Recipient Country Value (Economic Case): Critically Evaluate with conservative posture for Defra UK, Does the appraisal correctly focus on the social costs and benefits to the recipient country, rather than the UK?
                                2. Context-Specific STPR (Economic Case): Critically Evaluate with conservative posture for Defra UK, Has an appropriate Social Time Preference Rate (STPR) for the recipient country been used for discounting, acknowledging that the standard UK rate may not be suitable?
                                3. Local Context and Alignment (Strategic Case): Critically Evaluate with conservative posture for Defra UK, Does the proposal demonstrate a deep understanding of the local context (political, economic, social, legal)? Does it align with the development priorities and strategies of the recipient country?
                                4. Risk and Sustainability (Management Case): Critically Evaluate with conservative posture for Defra UK, Are the unique risks associated with operating in the recipient country (e.g., political instability, currency fluctuations, local capacity) adequately identified and managed? Is the intervention designed to be sustainable after the ODA funding ceases?`;

                const redPrompt = `You are a Red Team reviewer evaluating a business case document. 
                                You will now evaluate six sections of a business case. For each section:
                                1. Evaluate all listed questions.
                                2. Provide a RAG (Red, Amber, Green) rating per question.
                                3. Show the output in Tabular format

                                Strategic Case Questions
                                1.	Has a Sustainability Impact Assessment been completed and included?
                                2.	Is the current system or policy being replaced clearly described?
                                3.	Is the rationale for change clearly explained?
                                4.	Are investment objectives clearly stated?
                                5.	Is there evidence of funding options, including private finance?
                                6.	Are SMART objectives clearly defined?
                                7.	Do benefits align with strategic objectives and are they mapped?
                                8.	Are place-based objectives considered?
                                19.	Is there a clear case for change?

                                Economic Case Questions
                                1.	Are spending objectives and key outcomes specified?
                                2.	Has a wide range of options (including BAU) been appraised?
                                3.	Are options described with pros/cons and conclusions?
                                4.	Is a preferred option identified with scope and delivery details?
                                5.	Are costs, benefits, and wider impacts assessed?
                                6.	Is optimism bias and cost of risk considered?
                                7.	Are costs/benefits adjusted for inflation and discounted?
                                8.	Are assumptions clear, evidenced, and consistent?
                                9.	Does the preferred option provide best overall value for money?

                                Commercial Case Questions
                                1.	Is the scope of requirement (value/volume) clearly defined?
                                2.	Is there an overview of the procurement strategy?
                                3.	Is market engagement completed or planned?
                                4.	Does the strategy demonstrate risk transfer and payment linkage?
                                5.	Are mitigations sufficient to protect Defra/government?
                                6.	Are top 3-5 commercial risks and mitigations identified?
                                7.	Has the Counter Fraud Hub been contacted for FRA?
                                8.	Has DgC resource been identified and engaged?
                                9.	Will the procurement method deliver the preferred option to quality and schedule?

                                Financial Case Questions
                                1.	Are all relevant costs and income identified across years?
                                2.	Do costs include inflation uplifts and efficiency savings?
                                3.	Is there evidence of stakeholder and authority support?
                                4.	Are funding and costs analysed by budget type?
                                5.	Are budget classifications justified?
                                6.	Are actions identified to address funding gaps?
                                7.	Are cost/income/funding assumptions clear and realistic?

                                Management Case Questions
                                1.	Are governance, control, and reporting lines clearly defined?
                                2.	If another public body is affected, is joint governance agreed? 
                                3.	Are internal/external participants clearly identified?
                                4.	Are expert advisers involved?
                                5.	Is stakeholder engagement identified and explained?
                                6.	Has stakeholder analysis been conducted?
                                7.	Is there a communications plan?
                    
                                IT Specialist Questions
                                1.	Are governance and reporting arrangements clearly defined?
                                2.	Has the DDTS strategy been incorporated into the Strategic Case?
                                3.	Has the User Need been identified and tested?
                                4.	Have DDTS Sustainability Guidelines been followed?
                                5.	Have Accessibility Guidelines been built into the digital service?
                                6.	Are digital and technology options and costs included in the Financial Case?
                                7.	Is spend control from DTSA PAB in place for current and next phase?`

                let requestPrompt = {
                  "systemprompt": analysisType === 'green' ? greenPrompt : redPrompt,
                  "userprompt": pdfTextContent
                }

                const response = await axios.post(`${backendApiUrl}/summarize`, {
                  "systemprompt": requestPrompt.systemprompt,
                  "userprompt": requestPrompt.userprompt,
                  "modelid": model
                }, {
                  headers: {
                    'Content-Type': 'text/plain'
                  }
                });

                const summaries = response.data.summarizeresult.map((summary) => {
                  return summary.text
                }).join('\n\n');

                // Return the view with both summary and markdown content
                return h.view('upload/index', {
                  isAuthenticated: true,
                  user: request.auth.credentials.user,
                  status: 'success',
                  markdownContent: summaries,
                  filename: file.hapi.filename,
                  model: model,
                  analysisType: analysisType
                })
              } catch (apiError) {
                logger.error(`Backend API error: ${apiError.message}`)
                if (apiError.status) {
                  logger.error(`Status: ${apiError.status}`)
                }
                if (apiError.error) {
                  logger.error(`Error details: ${JSON.stringify(apiError.error)}`)
                }

                // Return the view with just the markdown content
                return h.view('upload/index', {
                  isAuthenticated: true,
                  user: request.auth.credentials.user,
                  status: 'success',
                  markdownContent: 'Unable to generate summary. Using raw document content instead.',
                  filename: file.hapi.filename,
                  model: model,
                  analysisType: analysisType
                })
              }
            } catch (error) {
              logger.error(`Error while parsing PDF: ${error}`)
              logger.error(
                `JSON Error while parsing PDF: ${JSON.stringify(error)}`
              )
              return h.view('upload/index', {
                isAuthenticated: true,
                user: request.auth.credentials.user,
                status: 'error',
                message: 'Error processing PDF: ' + error.message,
                model: model,
                analysisType: analysisType
              })
            }
          }
        }
      ])
    }
  }
}
