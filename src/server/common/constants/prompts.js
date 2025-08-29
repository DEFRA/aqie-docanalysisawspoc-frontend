export const greenPrompt = `Evaluate the text based on the Green Book CENTRAL GOVERNMENT GUIDANCE ON APPRAISAL AND EVALUATION given below 
You will now evaluate six sections of a business case. Begin your response with a concise summary of the overall evaluation, followed by detailed sections. 
For each section: 
1. Provide a RAG (🔴 Red, 🟠 Amber, 🟢 Green) rating per question.
2. Create a summary for each case section of count of red, amber and green rating (with total number of Red, Amber and Green) at the end of the report 
3. Show the output in Tabular format (Question, Rating and Comments)
4. Use the exact project name as the title of the Output
                   
For The Strategic Dimension:
critically Evaluate for DEFRA the Strategic Case of the attached business case based on the principles outlined in HM Treasury's Green Book. Your analysis should cover:
1. Case for Change: Critically Evaluate with conservative posture for Defra UK, Is there a compelling case for change? Does it clearly articulate the rationale for intervention and is it supported by objective evidence?
2. Business as Usual (BAU): Critically Evaluate with conservative posture for Defra UK, Has the BAU scenario been quantitatively defined to provide a clear benchmark for comparison?
3. SMART Objectives: Critically Evaluate with conservative posture for Defra UK, Are the objectives Specific, Measurable, Achievable, Realistic, and Time-limited (SMART)? Do they focus on outcomes rather than outputs?
4. Strategic Fit: Critically Evaluate with conservative posture for Defra UK, How well does this proposal align with wider government policies and the organization's strategic goals?
5. Constraints and Dependencies: Critically Evaluate with conservative posture for Defra UK, Have all significant external constraints (legal, ethical, etc.) and dependencies (e.g., other projects, infrastructure) been identified and addressed? "

For The Economic Dimension :
"Analyze the Economic Case of the business case in accordance with the Green Book's guidance on social value appraisal. Your evaluation must address:
1. Options Appraisal: Critically Evaluate with conservative posture for Defra UK, Was a comprehensive longlist of options considered using the options framework-filter, leading to a viable shortlist for detailed analysis? This should include a 'do-minimum' option.
2. Social Cost-Benefit Analysis (CBA) / Cost-Effectiveness Analysis (CEA): Critically Evaluate with conservative posture for Defra UK, Has the appropriate analysis (CBA or CEA) been used to compare shortlisted options? Are all significant social and environmental costs and benefits (monetized and unmonetized) to UK society included and valued appropriately?
3. Valuation: Critically Evaluate with conservative posture for Defra UK, Are valuations of costs and benefits based on market prices, or where not possible, approved non-market valuation techniques? Are costs and benefits presented in real terms and discounted using the correct Social Time Preference Rate (STPR)?
4. Risk and Optimism Bias: Critically Evaluate with conservative posture for Defra UK, Has optimism bias been explicitly and appropriately applied to costs, benefits, and timelines? Is there a clear risk register and has the cost of risk been properly estimated?
5. Value for Money (VfM): Critically Evaluate with conservative posture for Defra UK, Does the analysis present a clear Net Present Social Value (NPSV) and Benefit-Cost Ratio (BCR) for each option to determine the optimal VfM? Does the VfM judgment appropriately consider unquantifiable benefits and risks? "

For The Commercial Dimension:
"Assess the Commercial Case of the business case as per the Green Book framework. Your evaluation should focus on:
1. Commercial Viability: Critically Evaluate with conservative posture for Defra UK, Is the proposed commercial strategy realistic and credible? Can a viable deal be struck with the market?
2. Procurement Strategy: Critically Evaluate with conservative posture for Defra UK, Does the procurement specification logically follow from the strategic and economic cases? Has sufficient market appetite and capacity been assessed?
3. Risk Allocation: Critically Evaluate with conservative posture for Defra UK, Is there a clear and optimal allocation of risks between the public and private sectors? Is risk borne by the party best able to manage it?
4. Contractual Arrangements: Critically Evaluate with conservative posture for Defra UK, If Public-Private Partnership (PPP) options are considered, have they been robustly compared against a Public Sector Comparator? Is there sufficient contractual flexibility to handle future changes without incurring unacceptable costs? "

For The Financial Dimension:
"Evaluate the Financial Case of the business case using the principles from the Green Book. Your analysis must include:
1. Affordability: Critically Evaluate with conservative posture for Defra UK, Is the proposal affordable within the organization's current and future budget allocations?
2. Public Sector Cost: Critically Evaluate with conservative posture for Defra UK, Does the case accurately present the net financial impact on the public sector over the proposal's lifetime, including all capital and revenue costs?
3. Accounting and Budgeting: Critically Evaluate with conservative posture for Defra UK, Are costs calculated correctly according to National Accounts rules and presented on an accruals basis consistent with departmental budgets? Are financial statements (budget, cash flow, funding) provided and robust?
4. Contingency: Critically Evaluate with conservative posture for Defra UK, Is there a clear and appropriate financial contingency allowance derived from residual optimism bias and quantified risks, and is its purpose (to inform the approving authority's reserves) understood? "

For The Management Dimension: 
"Assess the Management Case of the business case based on the Green Book's requirements for successful delivery. Your evaluation should examine:
1. Delivery Plan: Critically Evaluate with conservative posture for Defra UK, Is there a realistic and robust plan for implementation? Are there clear milestones, and is the timeline achievable?
2. Governance and Resources: Critically Evaluate with conservative posture for Defra UK, Is the organizational structure for governance and delivery clearly defined? Are the required resources (personnel, skills) available and properly managed?
3. Risk and Benefit Management: Critically Evaluate with conservative posture for Defra UK, Is there a comprehensive Risk Register with clear ownership and mitigation plans? Is there a Benefits Register to track the realization of expected benefits?
4. Monitoring and Evaluation: Critically Evaluate with conservative posture for Defra UK, Are there proportionate and budgeted plans for monitoring and evaluation before, during, and after implementation to track performance and learn lessons? "

For The IT Dimension:
"Drawing upon the principles of the Green Book's Five Case Model, evaluate the IT-specific aspects of this business case. Your assessment should consider:
1. Strategic Alignment (Strategic Case): Critically Evaluate with conservative posture for Defra UK, How does the proposed IT solution support the SMART objectives and overall business needs? Is there a risk of technological obsolescence, and how is it managed? Is the IT solution dependent on other infrastructure (e.g., connectivity) and is this dependency managed?
2. Value and Cost (Economic/Financial Cases): Critically Evaluate with conservative posture for Defra UK, Are the full whole-life costs of the IT system (including procurement, implementation, maintenance, and eventual replacement) accurately estimated and included in the appraisal? Is there a clear benefit realization plan for the IT investment?
3. Sourcing and Delivery (Commercial/Management Cases): Critically Evaluate with conservative posture for Defra UK, Has the procurement of IT been considered (e.g., build vs. buy, specific frameworks)? Does the management case reflect best practices for IT project delivery, such as Agile methodologies where appropriate?
4. Risk Management (Management Case): Critically Evaluate with conservative posture for Defra UK, Are IT-specific risks (e.g., data security, system integration, user adoption, supplier failure) identified and mitigated in the risk register?"

For The Official Development Assistance (ODA) Dimension:
"Evaluate this business case for its suitability as an Official Development Assistance (ODA) proposal, applying the core principles of the Green Book while adapting for the international development context. Your evaluation should cover:
1. Recipient Country Value (Economic Case): Critically Evaluate with conservative posture for Defra UK, Does the appraisal correctly focus on the social costs and benefits to the recipient country, rather than the UK?
2. Context-Specific STPR (Economic Case): Critically Evaluate with conservative posture for Defra UK, Has an appropriate Social Time Preference Rate (STPR) for the recipient country been used for discounting, acknowledging that the standard UK rate may not be suitable?
3. Local Context and Alignment (Strategic Case): Critically Evaluate with conservative posture for Defra UK, Does the proposal demonstrate a deep understanding of the local context (political, economic, social, legal)? Does it align with the development priorities and strategies of the recipient country?
4. Risk and Sustainability (Management Case): Critically Evaluate with conservative posture for Defra UK, Are the unique risks associated with operating in the recipient country (e.g., political instability, currency fluctuations, local capacity) adequately identified and managed? Is the intervention designed to be sustainable after the ODA funding ceases?`

export const redPrompt = `You are a Red Team reviewer evaluating a business case document. 
You will now evaluate six sections of a business case. Begin your response with a concise summary of the overall evaluation, followed by detailed sections.
For each section:
1. Evaluate all listed questions.
2. Provide a RAG (🔴 Red, 🟠 Amber, 🟢 Green) rating per question.
3. Show the output in Tabular format (Question, Rating and Comments)
4. Create a summary for each case section of count of red, amber and green rating (with total number of Red, Amber and Green) at the end of the report 
5. Use the exact project name as the title of the Output

Strategic Case:
    1. Is the strategic fit current and sufficiently detailed for Full Business Case (FBC) stage?
    2. Is the proposal aligned with Defra, OGDs, and SoS priorities?
    3. Has a Sustainability Impact Assessment been completed and included as an annex?
    4. Is the existing system/policy fully described?
    5. Are future arrangements clearly outlined?
    6. Is the rationale for replacement or change well justified?
    7. Is there a plan to capture impact evidence for future decisions?
    8. Is the importance of the proposal explained using a Theory of Change approach?
    9. Are objectives updated post-procurement and clearly stated?
    10. Are funding options assessed per Green Book guidance?
    11. Is the Golden Thread current and evidence-based?
    12. Are SMART objectives aligned with strategic/government priorities?
    13. Have adjustments post-procurement been incorporated?
    14. Are benefits and dis-benefits clearly articulated?
    15. Do benefits support strategic objectives?
    16. Is there a Benefits Map showing cause-effect relationships?
    17. Are place-based objectives finalized if applicable?
    18. Are key risks and mitigations clearly defined?
    19. Are delivery constraints and dependencies explained?
    20. Are external dependencies and decision points identified?
    21. Are security implications for Defra's CNI and staff considered?
    22. Are threats to assets, personnel, and cyber security addressed?
    23. Is compliance with GDPR, Cyber Essentials, NIST, ISO27001 outlined?
    24. Are assumptions and figures consistent across all cases?
    25. Are legal powers (vires) in place or progressing?
    26. Are AO assessments on regularity and propriety supported by strategic analysis?

Economic Case Questions
    1. Is the economic rationale for government intervention accurately set out and consistent with the strategic case?
    2. Does the OBC confirm the strategic aims, critical success factors, and spending objectives?
    3. When setting out the rationale for intervention, does the business case consider whether there will be significant gains or losses to any groups within society?
    4. At the longlist stage, has a wide range of options been considered and assessed against the CSFs?
    5. Are the options presented credible, do they meet core needs, and are they sustainable?
    6. When selecting short-list options from the longlist, have they been assessed against the following criteria: deliver on spending objectives and CSFs, are practical and feasible, are sufficiently dissimilar to other options, and are within suitable risk limits?
    7. For each of the shortlisted options, have all the costs and benefits, including wider impacts, been identified, explained, and assessed?
    8. Have all relevant and appropriate costs and benefits been identified, valued where possible, and used to identify the option which best balances expected costs and benefits?
    9. When calculating the net present social value, have monetised costs and benefits been adjusted for inflation and discounted?
    10. Has optimism bias been applied to both costs (an increase) and benefits (a reduction), and is the source of the values used clear?
    11. Does the business case quantify the cost of risk through a 'risk cost' added to the options' costs, and has optimism bias been reduced in parallel?
    12. Does the OBC evidence that strategies to reduce optimism bias have been applied (e.g., stakeholder requirement identification, accurate costing, risk mitigation)?
    13. Are the assumptions underpinning the analysis clear, well evidenced, and consistent with the other cases?
    14. Have the sources and assumptions underlying each cost and benefit line in the economic appraisals been explained in full?
    15. Has the uncertainty in the analysis been communicated, with values presented as ranges and sensitivity tested with an assessment of how likely those values are?
    16. Have key assumptions been changed to sensitivity test the robustness of the ranking of the options?
    17. Have switching values been used to indicate how much a variable would need to change to make the preferred option no longer worthwhile?
    18. If sensitivity analysis reveals that small changes in assumptions alter option rankings, has this been clearly communicated and has further analysis been considered?
    19. Is the preferred option the most credible solution and does it represent the best value for money?
    20. Does the recommended option offer the best economic value and Value for Money to society, factoring in wider social and environmental effects?
    21. Has the selection of the preferred option factored in NPSV/NPSC, BCR, and the level of risk involved (including risk cost)?
    22. Has sufficient analysis, including qualitative benefits and costs, been undertaken to clearly identify the most credible solution?
    23. Has Defra's Value for Money Framework been applied to show that the social benefits of the preferred option justify the social costs?
    24. Has a Value for Money category been reported?
    25. Has a concise value for money statement been provided?
    26. In developing the intervention options, is there evidence that sufficient account has been taken of place-based, equalities, and/or distributional objectives and effects?
    27. Have all the costs and monetisable benefits and disbenefits been identified, explained, appraised, and valued?
    28. Have all the non-financial benefits and disbenefits, including wider impacts, been identified, explained, appraised, and valued?
    29. Are the benefits for all the short-listed options, including BAU and a realistic do-nothing, reflected in the Short List Appraisal?
    30. AO Test - VFM: Are the value for money conclusions in the AO assessment supported by the analysis in the Economic Case?
    31. Are you satisfied that the assumptions, assertions, figures, and other information set out in this case are consistent with the other cases?

Commercial Case Questions
    1. Is the scope of the requirement confirmed?
    2. Is there a clear procurement strategy, with route-to-market options considered and rationale for the selected option, contract/pricing strategy, contract implementation and management plan, and inclusion of social value and sustainability considerations?
    3. Is a copy of the procurement strategy provided as an annex to the case?
    4. Is there evidence of pre-market analysis and engagement?
    5. Have all the needed procurement activities and requirements for each (or at least the next) phase of delivery been identified?
    6. Is it clear where end users (stakeholders) will be involved?
    7. Are there any particularly novel, contentious, or high-risk elements related to this procurement?
    8. Are the mitigations being put in place sufficient to protect Defra and wider Government interests?
    9. Is there a commercial risk log with mitigations identified for each risk?
    10. Are there contractual obligations, processes, or measures in place to incentivise and manage contractors (outputs and behaviours) proactively to deliver to quality, cost, and schedule?
    11. Has a full Fraud Risk Assessment been completed and mitigating/managing actions taken (if deemed required by Counter Fraud Hub at SOC stage)?
    12. Has DgC resource been confirmed to support the commercial activity required?

Financial Case Questions
    1. Are all relevant costs and any external income identified in each financial year, including delivery, transition to BAU, ongoing service/maintenance, improvements, renewals, and non-cash costs (e.g. depreciation)?
    2. Do the costs include potential uplifts for inflation and/or savings from expected efficiencies (e.g. service costs at contractual breaks or renewals)?
    3. Does the case separately identify secured and/or assumed funding for each financial year, compared to expected costs and any funding gap or surplus?
    4. Is there evidence of stakeholder support and funding (in principle) from the approving authority?
    5. If funding is assumed beyond the current Spending Review period, is this sufficiently caveated?
    6. Are the funding and costs/income analysed by budget type (RDEL Admin, RDEL Programme, CDEL, AME)?
    7. Where OGD delivery partners are involved, has affordability been assessed for their expenditure?
    8. Does the case justify the cost and income budget classifications?
    9. Do any conditions and/or ring-fences apply to any funding already secured?
    10. If there are funding gaps in one or more financial years, have actions been identified to address them?
    11. Are the key assumptions behind the cost, income, and funding estimates clearly identified, reasonable, realistic, evidence-based, and with no obvious gaps?
    12. Are identified risks consistent with risks and mitigations identified elsewhere in the business case?
    13. Where significant uncertainty exists, have assumptions been adjusted for Optimism Bias, and is this consistent with the Economic Case?
    14. Is the sensitivity of affordability to these assumptions sufficiently demonstrated?
    15. Do cost assumptions align with stated resourcing plans, including use of external resources where required?
    16. Are impacts on the balance sheet identified (e.g. creation of non-current assets or liabilities)?
    17. Has any potentially complex accounting treatment been assessed with reference to relevant accounting standards?
    18. Have any potential contingent assets or liabilities been identified?
    19. Are there any missing numbers, values, or analysis? Do the numbers add up and are they consistent with other parts of the business case?
    20. Are the financial figures clear and understandable, avoiding jargon and unexplained abbreviations?
    21. Have all potential applicable tax implications been assessed, including VAT?
    22. Is any planned expenditure or income potentially novel, contentious, or repercussive, requiring HM Treasury or Cabinet Office approval?
    23. Does the financial case provide a clear conclusion regarding affordability, supported by evidence in the case?
    24. Has the financial case been agreed and signed off by the relevant Finance Business Partner (FBP)?
    25. Are you satisfied that the assumptions, assertions, figures, and other information set out in this case are consistent with the other cases?

Management Case Questions
    1. Are the governance arrangements, project control procedures, and lines of reporting and responsibility/accountability clearly set out?
    2. Does the proposal affect the responsibility of another public body; if so, has a joint approach been agreed and are appropriate governance and management arrangements in place?
    3. Does the OBC show how stakeholder engagement has influenced the choice of option?
    4. Is there a communications plan in place for continuing to engage stakeholders throughout the detailed planning and/or design stage?
    5. Is there a Change Management plan that indicates the scale of the change and capacity to achieve the strategic aims?
    6. Does the Change Management plan cover impacts on processes, people, and technology?
    7. For the selected option to develop to FBC stage, have the headline risks, assumptions, issues, dependencies, and constraints been effectively managed?
    8. Is the risk register included?
    9. Have risks been allocated to the organisation best placed to monitor and manage them?
    10. Are adequate contingency arrangements in place?
    11. Have benefit owners been identified, and have they agreed the benefit realisation plan, forecasts, and valuation assumptions (as indicated in the 'Sign Off' field in each benefit profile)?
    12. Within each benefit profile, is there a benefit tracking/monitoring artefact showing a visible projection of the realisation timeline?
    13. Have draft Benefits Profiles been included that define each benefit (and disbenefit), including baselines and measures?
    14. Does the business case include an evaluation plan approved by a Lead Analyst or delegate (or a reason for its absence)?
    15. Does the Integrated Approval and Assurance Plan (IAAP) show the sequencing of OBC approval and assurance activities, both internal and external?
    16. Has reference been made to an Equality Impact Assessment (to align with Public Sector Equality Duty), or is there a reasoned explanation for its omission?
    17. Do sufficient resources still exist to develop the FBC stage?
    18. Has a project delivery approach been clearly set out, including procurement strategy and coverage of complex or high-risk elements?
    19. If applicable, does the Management Case indicate engagement with the Green Finance team regarding UK Green Financing Framework reporting requirements?
    20. Is there a clear, detailed high-level plan for achieving day one readiness, including milestones, design/build/operational phases, and a critical path?
    21. Where applicable, has the plan incorporated supplier responses to confirm achievability?
    22. Are there any gaps (e.g. missing detail, context, rationale, analysis, or products)?
    23. Are you satisfied that the assumptions, assertions, figures, and other information set out in this case are consistent with the other cases?
    24. AO Test - FEASIBILITY: Are the feasibility conclusions in the AO assessment supported by the analysis in the Management Case?
   
IT Specialist Questions
    1. Has the DDTS strategy been incorporated into the Strategic Case?
    2. Has the User Need been identified and tested?
    3. Have the DDTS Sustainability Guidelines been followed?
    4. Have the Accessibility guidelines been clearly built into the development of a digital service?
    5. Have the Digital & Technology Options, including resource costs, been included within the Financial Case?
    6. Has the team got sufficient spend control from DTSA PAB in place to cover the current costs and next phase (Management Case)?
    7. Has the team undergone the appropriate Service Assessment (Alpha Assessment), and are there clearly marked plans to undertake Beta and Live Service Assessments (Management Case)?
    
Also provide a summary of the full evaluation of the full document in line with the Green Book CENTRAL GOVERNMENT GUIDANCE ON APPRAISAL AND EVALUATION`